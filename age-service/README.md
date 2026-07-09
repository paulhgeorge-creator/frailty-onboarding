# Pawl age-estimation service

Real Flask backend behind `age-estimator.js`'s `estimateAgeFromPhoto()`. Runs
today, has no trained model behind it - read this before assuming otherwise.

## Run it

```
pip install -r requirements.txt
python app.py
```

Serves on `http://localhost:5001`. `POST /estimate-age` (multipart `image` +
optional `species`) → `{ageYears, confidence, status}`. `GET /health` reports
whether a trained model is loaded.

## Current status: no trained weights, on purpose

This service does not estimate real ages yet. `confidence` is always `0.0`
and `status` is `"untrained"` until `AGE_MODEL_WEIGHTS` points at a real
trained Keras model file. This isn't a stub avoided for time - a real,
usable trained model doesn't exist to drop in:

- **`szmazurek/Age_recognition_Cyfrovet`** (the referenced repo) is a
  TensorFlow *training pipeline* (`train.py` + notebooks), not a packaged
  model - no weights are checked in.
- It has **no LICENSE file**. Copying its training/model code into this
  (commercial) project without contacting the author first is a real legal
  risk, not a technicality - get that cleared before using their code
  directly, even if you do end up training against their approach.
- It classifies into **3 age buckets**, not a continuous age in years -
  would need remapping to a years estimate with a wide uncertainty band
  either way.
- It's **dog-only** - no cat coverage, and Pawl needs both.
- The author's own README says results are "still not satisfying."

`model.py` defines the real serving contract (image in, `{ageYears,
confidence, status}` out) and a real `AgePredictor` class already wired for
inference - but training an actual model requires a labeled dataset (the
Cyfrovet README points at https://tinyurl.com/dog-age-datasets) and GPU time
neither of which happen inside a coding session. That's the real remaining
work, not a code gap.

## Wiring in a real model later

1. Get licensing clarity from the Cyfrovet author, or train an original
   architecture against a properly licensed dataset.
2. Train, save a Keras model to disk.
3. Set `AGE_MODEL_WEIGHTS=/path/to/model.h5` before starting `app.py`.
4. `AgePredictor._load_model` and `predict()` already handle the rest -
   preprocessing (resize/normalize) is generic until a concrete model's
   exact input contract is known; adjust `predict()` to match once it is.

Until then, `fuseAge()` in `frailty-model.js` treats this service's
`confidence: 0` as "no signal" - the app's final age always falls back to
DOB / owner-entered years / size-based prior, never a fabricated photo guess.
