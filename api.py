import json
import os
import pickle
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)

allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS",
        "https://idea-evaluator-jet.vercel.app,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
if not allowed_origins or "*" in allowed_origins:
    raise RuntimeError("FRONTEND_ORIGINS must contain explicit allowed origins.")

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.config["MAX_CONTENT_LENGTH"] = 32 * 1024


def load_model():
    model_path = Path(__file__).resolve().with_name("startup_model.pkl")
    try:
        with model_path.open("rb") as model_file:
            model = pickle.load(model_file)
    except (
        OSError,
        EOFError,
        pickle.UnpicklingError,
        AttributeError,
        ImportError,
        ValueError,
    ):
        app.logger.exception("Could not load the startup prediction model")
        return None

    if (
        model is not None
        and model.__class__.__name__ == "LogisticRegression"
        and not hasattr(model, "multi_class")
    ):
        model.multi_class = "ovr"
    return model


model = load_model()


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Request body is too large"}), 413


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "running", "message": "Idea Evaluator API is online"})


@app.route("/model-info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"error": "The prediction model is unavailable"}), 503

    expected_count = getattr(model, "n_features_in_", None)
    feature_names = getattr(model, "feature_names_in_", None)
    if expected_count is None or feature_names is None or len(feature_names) != expected_count:
        return jsonify({"error": "The model feature schema is unavailable"}), 503

    return jsonify({
        "feature_count": int(expected_count),
        "features": list(feature_names),
    })


@app.route("/evaluate", methods=["POST"])
def evaluate():
    if model is None:
        return jsonify({"error": "The prediction model is unavailable"}), 503

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    features = payload.get("features")
    if not isinstance(features, list):
        return jsonify({"error": "features must be an array of numeric model inputs"}), 400

    expected_count = getattr(model, "n_features_in_", None)
    if expected_count is None:
        return jsonify({"error": "The model feature schema is unavailable"}), 503
    if len(features) != expected_count:
        return jsonify({
            "error": f"features must contain exactly {expected_count} numeric values"
        }), 400

    try:
        normalized_features = []
        for value in features:
            if value is None:
                normalized_features.append(0)
            elif isinstance(value, bool) or not isinstance(value, (int, float)):
                return jsonify({"error": "Every feature must be a number or null"}), 400
            else:
                normalized_features.append(value)
        feature_values = np.asarray(normalized_features, dtype=float)
    except (OverflowError, ValueError):
        return jsonify({"error": "Feature values must be finite numbers"}), 400
    if not np.isfinite(feature_values).all():
        return jsonify({"error": "Feature values must be finite numbers"}), 400

    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is not None:
        named_features = dict(zip(feature_names, feature_values))
        binary_features = [
            name for name in feature_names
            if name.startswith("is_") or name.startswith("has_")
        ]
        if any(named_features[name] not in (0, 1) for name in binary_features):
            return jsonify({"error": "Binary indicator features must be 0 or 1"}), 400

        location_features = ("is_CA", "is_NY", "is_MA", "is_TX", "is_otherstate")
        industry_features = (
            "is_software",
            "is_web",
            "is_mobile",
            "is_enterprise",
            "is_advertising",
            "is_gamesvideo",
            "is_ecommerce",
            "is_biotech",
            "is_consulting",
            "is_othercategory",
        )
        if all(name in named_features for name in location_features):
            if sum(named_features[name] for name in location_features) > 1:
                return jsonify({"error": "At most one location indicator may be 1"}), 400
        if all(name in named_features for name in industry_features):
            if sum(named_features[name] for name in industry_features) != 1:
                return jsonify({"error": "Exactly one industry indicator must be 1"}), 400

    model_input = (
        pd.DataFrame([feature_values], columns=feature_names)
        if feature_names is not None
        else feature_values.reshape(1, -1)
    )

    try:
        prediction = model.predict(model_input)[0]
        class_labels = list(model.classes_)
        success_index = class_labels.index(1)
        probability = model.predict_proba(model_input)[0][success_index]
    except (AttributeError, IndexError, TypeError, ValueError):
        app.logger.exception("Prediction failed for validated model input")
        return jsonify({"error": "The model could not evaluate these features"}), 500

    return jsonify({
        "prediction": int(prediction),
        "prediction_label": "acquired" if int(prediction) == 1 else "closed",
        "acquisition_probability": float(probability),
        "success_probability": float(probability),
    })


def _provider_error(status):
    if status == 401:
        return "OpenRouter rejected the API key. Check OPENROUTER_API_KEY on Render."
    if status in (402, 403, 404):
        return (
            "The configured OpenRouter model is unavailable to this account. "
            "Set OPENROUTER_MODEL to a free model enabled for your account."
        )
    if status == 429:
        return "OpenRouter rate limit reached. Please try again shortly."
    if status >= 500:
        return "OpenRouter is temporarily unavailable. Please try again later."
    return "OpenRouter could not complete the evaluation. Check the backend configuration."


@app.route("/api/ai-evaluate", methods=["POST"])
def ai_evaluate():
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    model_id = os.environ.get("OPENROUTER_MODEL", "").strip()

    if not api_key:
        return jsonify({"error": "AI evaluation is not configured on the server"}), 503
    if not model_id or not model_id.endswith(":free"):
        return jsonify({
            "error": (
                "Set OPENROUTER_MODEL to a free OpenRouter model ID ending in ':free'."
            )
        }), 503

    payload = request.get_json(silent=True)
    messages = payload.get("messages") if isinstance(payload, dict) else None
    if not isinstance(messages, list) or not messages or len(messages) > 14:
        return jsonify({"error": "messages must contain between 1 and 14 chat messages"}), 400

    validated_messages = []
    total_characters = 0
    for message in messages:
        if not isinstance(message, dict) or message.get("role") not in ("user", "assistant"):
            return jsonify({"error": "Each message must have a user or assistant role"}), 400

        content = message.get("content")
        if not isinstance(content, str) or not content.strip() or len(content) > 4000:
            return jsonify({"error": "Each message must contain 1 to 4000 characters"}), 400

        total_characters += len(content)
        validated_messages.append({"role": message["role"], "content": content.strip()})

    if total_characters > 16000:
        return jsonify({"error": "Conversation content exceeds the allowed size"}), 400
    if validated_messages[-1]["role"] != "user":
        return jsonify({"error": "The latest chat message must be from the user"}), 400

    system_prompt = (
        "You evaluate startup ideas in simple, clear English. Provide the idea's "
        "problem, objective, solution, execution steps, strengths, risks, and one "
        "recommendation. Do not claim that you verified market data. End with exactly "
        'one score line in this format: SCORES:{"innovation":75,"market":60,'
        '"feasibility":70}. Use whole-number scores from 0 to 100.'
    )
    provider_payload = json.dumps({
        "model": model_id,
        "messages": [{"role": "system", "content": system_prompt}, *validated_messages],
        "temperature": 0.4,
        "max_tokens": 1200,
    }).encode("utf-8")
    provider_request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=provider_payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.environ.get(
                "FRONTEND_URL", "https://idea-evaluator-jet.vercel.app"
            ),
            "X-Title": "Idea Evaluator AI",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(provider_request, timeout=30) as response:
            provider_response = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        app.logger.warning("OpenRouter request failed with HTTP status %s", error.code)
        return jsonify({"error": _provider_error(error.code)}), 502
    except (TimeoutError, urllib.error.URLError):
        app.logger.warning("OpenRouter request timed out or could not connect")
        return jsonify({"error": "OpenRouter could not be reached before the request timed out"}), 504
    except (UnicodeDecodeError, json.JSONDecodeError):
        app.logger.warning("OpenRouter returned an invalid JSON response")
        return jsonify({"error": "OpenRouter returned an invalid response"}), 502

    try:
        reply = provider_response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        reply = None

    if not isinstance(reply, str) or not reply.strip():
        app.logger.warning("OpenRouter returned an empty or malformed completion")
        return jsonify({"error": "OpenRouter returned an empty evaluation"}), 502

    return jsonify({"reply": reply.strip()})


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=False,
    )
