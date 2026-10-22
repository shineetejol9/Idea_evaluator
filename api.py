
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
<<<<<<< Updated upstream
@app.route("/")
=======
CORS(app)

# Load the trained model
with open("startup_model.pkl", "rb") as f:
    model = pickle.load(f)


@app.route("/", methods=["GET"])
>>>>>>> Stashed changes
def home():
    return jsonify({
        "status": "running",
        "message": "Idea Evaluator API is online"
    })
<<<<<<< Updated upstream
# load trained model
model = pickle.load(open("startup_model.pkl", "rb"))
=======

>>>>>>> Stashed changes

@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        data = request.get_json()
        features = np.array(data["features"]).reshape(1, -1)

        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0][1]

        return jsonify({
            "prediction": int(prediction),
            "success_probability": float(probability)
        })

    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed"}), 400


if __name__ == "__main__":
<<<<<<< Updated upstream
    app.run(port=5000, debug=True)
=======
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
>>>>>>> Stashed changes
