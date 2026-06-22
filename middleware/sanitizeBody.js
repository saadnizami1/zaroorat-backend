/**
 * Strips MongoDB operator keys ($-prefixed) and dotted keys from req.body to
 * prevent NoSQL operator injection (e.g. { email: { $gt: "" } }).
 *
 * Express-5 safe: only mutates req.body. We deliberately do NOT touch req.query
 * (it is a read-only getter in Express 5; query inputs are type/length-checked
 * at the point of use instead).
 */
function scrub(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(scrub);
    return;
  }
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        scrub(obj[key]);
      }
    }
  }
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    scrub(req.body);
  }
  next();
}

module.exports = sanitizeBody;
