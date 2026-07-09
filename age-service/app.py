"""Age-estimation service. Real Flask server, real endpoint contract, no
trained model behind it yet - see README.md."""
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError

from model import AgePredictor

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB upload cap

predictor = AgePredictor()


@app.get("/health")
def health():
    return jsonify(status="ok", modelTrained=predictor.is_trained)


@app.post("/estimate-age")
def estimate_age():
    if "image" not in request.files:
        return jsonify(ageYears=None, confidence=0.0, status="no-image"), 400

    species = request.form.get("species")
    try:
        image = Image.open(request.files["image"].stream)
        image.load()
    except UnidentifiedImageError:
        return jsonify(ageYears=None, confidence=0.0, status="invalid-image"), 400

    result = predictor.predict(image, species=species)
    return jsonify(**result)


if __name__ == "__main__":
    app.run(port=5001, debug=False)
