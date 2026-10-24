import json
import os
from io import BytesIO
from pathlib import Path
from unittest import TestCase
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

import numpy as np
import pandas as pd

import api


class FakeModel:
    n_features_in_ = 2
    feature_names_in_ = np.array(["metric_one", "metric_two"])
    classes_ = np.array([0, 1])

    def predict(self, features):
        self.received_features = features
        return np.array([1])

    def predict_proba(self, features):
        return np.array([[0.2, 0.8]])


class ApiTests(TestCase):
    def setUp(self):
        api.app.config["TESTING"] = True
        self.client = api.app.test_client()

    def test_home_reports_healthy_status(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "running")

    def test_model_info_returns_feature_order(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.get("/model-info")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "feature_count": 2,
            "features": ["metric_one", "metric_two"],
        })

    def test_ml_endpoint_predicts_from_validated_features(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.post("/evaluate", json={"features": [1, 2]})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "prediction": 1,
            "prediction_label": "acquired",
            "acquisition_probability": 0.8,
            "success_probability": 0.8,
        })

    def test_real_model_preserves_expected_feature_order_and_predictions(self):
        model = api.load_model()
        self.assertIsNotNone(model)

        expected_features = [
            "Unnamed: 0", "latitude", "longitude", "age_first_funding_year",
            "age_last_funding_year", "age_first_milestone_year",
            "age_last_milestone_year", "relationships", "funding_rounds",
            "funding_total_usd", "milestones", "is_CA", "is_NY", "is_MA",
            "is_TX", "is_otherstate", "is_software", "is_web", "is_mobile",
            "is_enterprise", "is_advertising", "is_gamesvideo", "is_ecommerce",
            "is_biotech", "is_consulting", "is_othercategory", "has_VC",
            "has_angel", "has_roundA", "has_roundB", "has_roundC",
            "has_roundD", "avg_participants", "is_top500",
        ]
        self.assertEqual(list(model.feature_names_in_), expected_features)

        dataset = pd.read_csv(Path(api.__file__).resolve().with_name("startup_data.csv"))
        row = dataset.loc[0, expected_features].fillna(0).tolist()
        model_input = pd.DataFrame([row], columns=model.feature_names_in_)

        prediction = model.predict(model_input)[0]
        probabilities = model.predict_proba(model_input)[0]

        self.assertEqual(list(model.classes_), [0, 1])
        self.assertEqual(int(prediction), 1)
        np.testing.assert_allclose(
            probabilities,
            np.array([0.32445318, 0.67554682]),
            rtol=1e-7,
            atol=1e-7,
        )

    def test_trained_model_accepts_a_real_training_row(self):
        dataset_path = Path(api.__file__).resolve().with_name("startup_data.csv")
        training_data = pd.read_csv(dataset_path)
        features = training_data.loc[0, list(api.model.feature_names_in_)].fillna(0).tolist()

        response = self.client.post("/evaluate", json={"features": features})

        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertIn(result["prediction"], (0, 1))
        self.assertEqual(
            result["prediction_label"],
            "acquired" if result["prediction"] == 1 else "closed",
        )
        self.assertEqual(result["success_probability"], result["acquisition_probability"])
        self.assertGreaterEqual(result["acquisition_probability"], 0)
        self.assertLessEqual(result["acquisition_probability"], 1)

    def test_trained_model_rejects_invalid_binary_indicator(self):
        feature_names = list(api.model.feature_names_in_)
        training_data = pd.read_csv(Path(api.__file__).resolve().with_name("startup_data.csv"))
        features = training_data.loc[0, feature_names].fillna(0).tolist()
        features[feature_names.index("is_CA")] = 2

        response = self.client.post("/evaluate", json={"features": features})

        self.assertEqual(response.status_code, 400)
        self.assertIn("0 or 1", response.get_json()["error"])

    def test_trained_model_rejects_invalid_industry_encoding(self):
        feature_names = list(api.model.feature_names_in_)
        training_data = pd.read_csv(Path(api.__file__).resolve().with_name("startup_data.csv"))
        features = training_data.loc[0, feature_names].fillna(0).tolist()
        industry_names = [
            name for name in feature_names
            if name in {
                "is_software", "is_web", "is_mobile", "is_enterprise",
                "is_advertising", "is_gamesvideo", "is_ecommerce", "is_biotech",
                "is_consulting", "is_othercategory",
            }
        ]
        for name in industry_names:
            features[feature_names.index(name)] = 0

        response = self.client.post("/evaluate", json={"features": features})

        self.assertEqual(response.status_code, 400)
        self.assertIn("Exactly one industry", response.get_json()["error"])

    def test_ml_endpoint_uses_training_zero_fill_for_missing_features(self):
        fake_model = FakeModel()
        with patch.object(api, "model", fake_model):
            response = self.client.post("/evaluate", json={"features": [1, None]})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(fake_model.received_features.iloc[0].tolist(), [1.0, 0.0])

    def test_ml_endpoint_rejects_wrong_feature_count(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.post("/evaluate", json={"features": [1]})

        self.assertEqual(response.status_code, 400)
        self.assertIn("exactly 2", response.get_json()["error"])

    def test_ml_endpoint_rejects_non_numeric_features(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.post("/evaluate", json={"features": [1, "two"]})

        self.assertEqual(response.status_code, 400)

    def test_ml_endpoint_rejects_non_finite_features(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.post(
                "/evaluate",
                data='{"features":[1,NaN]}',
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)

    def test_ml_endpoint_reports_missing_model(self):
        with patch.object(api, "model", None):
            response = self.client.post("/evaluate", json={"features": [1, 2]})

        self.assertEqual(response.status_code, 503)

    def test_ai_endpoint_reports_missing_key_without_contacting_provider(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch("api.urllib.request.urlopen") as open_url:
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 503)
        open_url.assert_not_called()

    def test_ai_endpoint_returns_provider_reply(self):
        provider_response = MagicMock()
        provider_response.__enter__.return_value.read.return_value = json.dumps({
            "choices": [{"message": {"content": "A real provider evaluation."}}],
        }).encode("utf-8")
        environment = {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }

        with patch.dict(os.environ, environment, clear=True):
            with patch("api.urllib.request.urlopen", return_value=provider_response) as open_url:
                response = self.client.post(
                    "/api/ai-evaluate",
                    headers={"Origin": "https://idea-evaluator-jet.vercel.app"},
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "https://idea-evaluator-jet.vercel.app",
        )
        self.assertEqual(response.get_json(), {"reply": "A real provider evaluation."})
        provider_request = open_url.call_args.args[0]
        self.assertEqual(provider_request.full_url, "https://openrouter.ai/api/v1/chat/completions")
        self.assertEqual(provider_request.get_method(), "POST")
        self.assertEqual(provider_request.get_header("Content-type"), "application/json")
        self.assertEqual(provider_request.get_header("Authorization"), "Bearer test-key")
        request_body = json.loads(provider_request.data)
        self.assertEqual(request_body["model"], "recursive/flint-v1.0:free")
        self.assertEqual(request_body["messages"][-1], {
            "role": "user",
            "content": "A startup idea",
        })

    def test_ai_endpoint_returns_rate_limit_and_retry_after(self):
        error = HTTPError(
            "https://openrouter.ai/api/v1/chat/completions",
            429,
            "rate limited",
            hdrs={"Retry-After": "17"},
            fp=BytesIO(
                b'{"error":"provider busy","echo":"private startup idea",'
                b'"credential":"test-key"}'
            ),
        )

        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", side_effect=error):
                with patch.object(api.app.logger, "warning") as warning:
                    response = self.client.post(
                        "/api/ai-evaluate",
                        json={"messages": [{
                            "role": "user",
                            "content": "private startup idea",
                        }]},
                    )

        self.assertEqual(response.status_code, 429)
        self.assertIn("rate limit", response.get_json()["error"])
        self.assertEqual(response.get_json()["retry_after"], "17")
        logged_details = " ".join(
            call.args[0] % call.args[1:] for call in warning.call_args_list
        )
        self.assertIn("Retry-After=17", logged_details)
        self.assertIn("provider busy", logged_details)
        self.assertNotIn("test-key", logged_details)
        self.assertNotIn("private startup idea", logged_details)

    def test_ai_endpoint_handles_malformed_rate_limit_error_body(self):
        error = HTTPError(
            "https://openrouter.ai/api/v1/chat/completions",
            429,
            "rate limited",
            hdrs=None,
            fp=BytesIO(b"not-json"),
        )

        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", side_effect=error):
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 429)
        self.assertIn("rate limit", response.get_json()["error"])
        self.assertNotIn("retry_after", response.get_json())

    def test_ai_endpoint_does_not_expose_provider_authentication_errors(self):
        error = HTTPError(
            "https://openrouter.ai/api/v1/chat/completions",
            401,
            "unauthorized",
            hdrs=None,
            fp=BytesIO(b'{"error":"private provider detail"}'),
        )

        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", side_effect=error):
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private provider detail", response.get_json()["error"])
        self.assertNotIn("test-key", response.get_data(as_text=True))

    def test_ai_endpoint_handles_provider_timeout(self):
        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", side_effect=TimeoutError):
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 504)

    def test_ai_endpoint_rejects_invalid_provider_json(self):
        provider_response = MagicMock()
        provider_response.__enter__.return_value.read.return_value = b"not json"

        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", return_value=provider_response):
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 502)
        self.assertIn("invalid response", response.get_json()["error"])

    def test_ai_endpoint_rejects_empty_provider_reply(self):
        provider_response = MagicMock()
        provider_response.__enter__.return_value.read.return_value = json.dumps({
            "choices": [{"message": {"content": " "}}],
        }).encode("utf-8")

        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "recursive/flint-v1.0:free",
        }, clear=True):
            with patch("api.urllib.request.urlopen", return_value=provider_response):
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 502)
        self.assertIn("empty evaluation", response.get_json()["error"])

    def test_ai_endpoint_rejects_paid_model_configuration(self):
        with patch.dict(os.environ, {
            "OPENROUTER_API_KEY": "test-key",
            "OPENROUTER_MODEL": "example/model",
        }, clear=True):
            with patch("api.urllib.request.urlopen") as open_url:
                response = self.client.post(
                    "/api/ai-evaluate",
                    json={"messages": [{"role": "user", "content": "A startup idea"}]},
                )

        self.assertEqual(response.status_code, 503)
        open_url.assert_not_called()

    def test_development_origin_is_allowed_for_preflight(self):
        response = self.client.options(
            "/evaluate",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:5173",
        )

    def test_production_origin_is_allowed_and_unknown_origins_are_not(self):
        allowed_responses = [
            self.client.options(
                path,
                headers={
                    "Origin": "https://idea-evaluator-jet.vercel.app",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "content-type",
                },
            )
            for path in ("/api/ai-evaluate", "/evaluate")
        ]
        blocked = self.client.options(
            "/api/ai-evaluate",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "POST",
            },
        )

        for allowed in allowed_responses:
            self.assertEqual(
                allowed.headers["Access-Control-Allow-Origin"],
                "https://idea-evaluator-jet.vercel.app",
            )
            self.assertIn("POST", allowed.headers["Access-Control-Allow-Methods"])
            self.assertIn("content-type", allowed.headers["Access-Control-Allow-Headers"].lower())
        self.assertNotIn("Access-Control-Allow-Origin", blocked.headers)

    def test_ml_post_includes_production_cors_headers(self):
        with patch.object(api, "model", FakeModel()):
            response = self.client.post(
                "/evaluate",
                headers={"Origin": "https://idea-evaluator-jet.vercel.app"},
                json={"features": [1, 2]},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "https://idea-evaluator-jet.vercel.app",
        )

    def test_configured_origins_trim_whitespace_and_normalize_trailing_slashes(self):
        self.assertEqual(
            api.parse_allowed_origins(
                " https://idea-evaluator-jet.vercel.app/ , http://localhost:5173 "
            ),
            ["https://idea-evaluator-jet.vercel.app", "http://localhost:5173"],
        )

    def test_configured_origins_reject_url_paths(self):
        with self.assertRaisesRegex(RuntimeError, "without paths"):
            api.parse_allowed_origins("https://idea-evaluator-jet.vercel.app/app")
