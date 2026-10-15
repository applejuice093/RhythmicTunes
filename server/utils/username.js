const User = require("../models/User");

const MAX_USERNAME_LENGTH = 24;
const USERNAME_PATTERN = /^[a-z0-9_]{1,24}$/;

/** Lower-cases a value and strips anything that isn't a-z, 0-9 or "_". */
const normalizeUsername = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, MAX_USERNAME_LENGTH);
};

/** True when a user-supplied username is already in canonical form. */
const isValidUsername = (value) =>
  typeof value === "string" && USERNAME_PATTERN.test(value.trim().toLowerCase());

/**
 * Picks the best starting point for a username: an explicit username, then
 * the display name, then the email prefix, falling back to "listener".
 */
const createUsernameBase = ({ username, name, email = "" }) => {
  const emailPrefix = String(email).split("@")[0] || "";
  return normalizeUsername(username || name || emailPrefix) || "listener";
};

/**
 * Returns `base`, `base1`, `base2`, ... — the first candidate not taken by
 * another user — while keeping the result within MAX_USERNAME_LENGTH.
 */
const generateUniqueUsername = async (details, excludeUserId) => {
  const base = createUsernameBase(details);
  let suffix = 0;

  while (true) {
    const nextSuffix = suffix ? String(suffix) : "";
    const candidateBase = base.slice(0, Math.max(1, MAX_USERNAME_LENGTH - nextSuffix.length));
    const candidate = `${candidateBase}${nextSuffix}`;
    const existingUser = await User.findOne({
      username: candidate,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).select("_id");

    if (!existingUser) {
      return candidate;
    }

    suffix += 1;
  }
};

module.exports = {
  MAX_USERNAME_LENGTH,
  createUsernameBase,
  generateUniqueUsername,
  isValidUsername,
  normalizeUsername,
};
