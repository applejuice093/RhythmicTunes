const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Extracts the token from an `Authorization: Bearer <token>` header.
 * The scheme is matched case-insensitively; returns null when absent/malformed.
 * @param {string | undefined} authHeader
 * @returns {string | null}
 */
const getBearerToken = (authHeader) => {
  if (typeof authHeader !== "string") {
    return null;
  }

  const [scheme, token, ...rest] = authHeader.trim().split(/\s+/);

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token || rest.length) {
    return null;
  }

  return token;
};

/**
 * Translates a jsonwebtoken verification error into a client-facing message.
 * All of these are 401s: the client must log in again to get a fresh token.
 */
const getTokenErrorMessage = (error) => {
  if (error && error.name === "TokenExpiredError") {
    return "Not authorized, token expired.";
  }

  if (error && (error.name === "JsonWebTokenError" || error.name === "NotBeforeError")) {
    return "Not authorized, token invalid.";
  }

  return "Not authorized, token failed.";
};

/**
 * Requires a valid JWT (issued by /api/auth/login or /api/auth/register).
 * On success, `req.user` is the user document without the password hash.
 *
 * Responses:
 *  - 401 when the token is missing, malformed, expired, invalid,
 *    or belongs to a user that no longer exists.
 *  - 500 when the user lookup itself fails (e.g. database unavailable).
 */
const protect = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: getTokenErrorMessage(error) });
  }

  try {
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to authenticate user.", error: error.message });
  }
};

/**
 * Like `protect`, but never rejects the request: if a valid token is present
 * `req.user` is set, otherwise the request continues anonymously. Use it for
 * public routes whose response depends on who is asking.
 */
const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Invalid or expired tokens are treated as anonymous requests.
  }

  return next();
};

/**
 * Must run after `protect`. Responds 403 unless the user has `isAdmin`.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
};

module.exports = {
  adminOnly,
  getBearerToken,
  getTokenErrorMessage,
  optionalAuth,
  protect,
};
