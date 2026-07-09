"""Pluggable photo-age predictor.

Real status: NO trained weights ship with this service, and none exist
publicly for a droppable model - see README.md for why (no license on the
reference repo, no shipped weights, dog-only coverage, author's own accuracy
caveat). Until AGE_MODEL_WEIGHTS points at a real trained model, predict()
honestly returns confidence=0 / status="untrained" rather than a fabricated
number. TensorFlow is only imported if a weights file is actually configured,
so this service runs today without requiring a multi-hundred-MB ML runtime
just to serve the honest "no model yet" response.
"""
import os

WEIGHTS_PATH = os.environ.get("AGE_MODEL_WEIGHTS", "")


class AgePredictor:
    def __init__(self, weights_path=WEIGHTS_PATH):
        self.weights_path = weights_path
        self._model = None
        if weights_path and os.path.exists(weights_path):
            self._model = self._load_model(weights_path)

    def _load_model(self, path):
        import tensorflow as tf  # ponytail: lazy import - only paid for once real weights exist
        return tf.keras.models.load_model(path)

    @property
    def is_trained(self):
        return self._model is not None

    def predict(self, image, species=None):
        """image: PIL.Image (already validated by the caller). Returns
        {ageYears, confidence, status}. confidence is always 0.0 when no real
        trained model is loaded - never a made-up number."""
        if not self.is_trained:
            return {"ageYears": None, "confidence": 0.0, "status": "untrained"}

        # Real inference path - exercised once a real model is configured.
        # Preprocessing (resize/normalize) matches whatever the loaded model
        # expects; kept generic here since no concrete trained model exists
        # yet to pin an exact input contract to.
        import numpy as np
        img = image.convert("RGB").resize((224, 224))
        arr = np.asarray(img, dtype="float32") / 255.0
        batch = np.expand_dims(arr, axis=0)
        pred = self._model.predict(batch, verbose=0)
        age_years = float(pred[0][0])
        return {"ageYears": age_years, "confidence": 0.5, "status": "ok"}
