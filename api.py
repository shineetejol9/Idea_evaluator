from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# load trained model
model = pickle.load(open("startup_model.pkl", "rb"))

@app.route("/evaluate", methods=["POST"])
def evaluate():

    data = request.json
    features = np.array(data["features"]).reshape(1, -1)

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    return jsonify({
        "prediction": int(prediction),
        "success_probability": float(probability)
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)