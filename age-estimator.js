/* Pluggable photo-based age estimation interface.
   estimateAgeFromPhoto() is the one seam a real model plugs into later -
   everything else in the app only depends on this function's return shape,
   never on how/whether a real model is running.

   Today it calls a local Flask service (see age-service/) that is real,
   running infrastructure with NO trained weights - see age-service/README.md.
   Until real weights exist, the service (and this function) honestly report
   confidence:0, which fuseAge() in frailty-model.js treats as "no signal" -
   this is how "don't rely on image estimation alone" is enforced in code,
   not just in copy. */
(function (root) {

  const DEFAULT_ENDPOINT = "http://localhost:5001/estimate-age";
  const TIMEOUT_MS = 4000;

  function unavailable(reason){
    return {years: null, confidence: 0, source: "photo", status: reason};
  }

  async function estimateAgeFromPhoto(file, {species, endpoint} = {}){
    if (!file) return unavailable("no-photo");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("image", file);
      if (species) form.append("species", species);

      const res = await fetch(endpoint || DEFAULT_ENDPOINT, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!res.ok) return unavailable("service-error");

      const data = await res.json();
      if (typeof data.ageYears !== "number" || !Number.isFinite(data.ageYears)) {
        return unavailable(data.status || "no-estimate");
      }
      return {
        years: data.ageYears,
        confidence: typeof data.confidence === "number" ? Math.max(0, Math.min(1, data.confidence)) : 0,
        source: "photo",
        status: data.status || "ok",
      };
    } catch (err) {
      // Network error, timeout, CORS, service not running - all treated the
      // same: no photo signal, rest of the age-fusion pipeline continues.
      return unavailable("unreachable");
    } finally {
      clearTimeout(timer);
    }
  }

  root.PawlAgeEstimator = { estimateAgeFromPhoto };

})(typeof window !== "undefined" ? window : globalThis);
