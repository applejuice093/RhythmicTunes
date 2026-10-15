const mongoose = require("mongoose");

// Matches the "At least 6 characters" hint shown on the register page.
const MIN_PASSWORD_LENGTH = 6;

// Deliberately simple: one "@", no whitespace, and a dot in the domain part.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

/** Lower-cases and trims an email; returns "" for non-string input. */
const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const isValidEmail = (value) => EMAIL_PATTERN.test(normalizeEmail(value));

/**
 * Returns a human-readable problem with the password, or null when it is OK.
 * @param {unknown} password
 * @returns {string | null}
 */
const getPasswordError = (password) => {
  if (typeof password !== "string" || !password) {
    return "Password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
};

/**
 * Express middleware factory that rejects requests whose `req.params[param]`
 * is not a valid MongoDB ObjectId, before a controller turns it into a
 * Mongoose CastError (which would otherwise surface as a 500).
 *
 * @param {string} param  route parameter name, e.g. "id"
 * @param {string} label  used in the error message, e.g. "user"
 */
const validateObjectIdParam = (param = "id", label = "resource") => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return res.status(400).json({ message: `Invalid ${label} ID.` });
  }

  return next();
};

module.exports = {
  MIN_PASSWORD_LENGTH,
  getPasswordError,
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
  validateObjectIdParam,
};
