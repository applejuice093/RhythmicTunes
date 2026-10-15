const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const {
  MIN_PASSWORD_LENGTH,
  getPasswordError,
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
  validateObjectIdParam,
} = require("../utils/validation");
const { getMissingEnvVars } = require("../config/env");
const {
  createUsernameBase,
  isValidUsername,
  normalizeUsername,
} = require("../utils/username");

/** Minimal stand-in for an Express response object. */
const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

test("normalizeEmail trims and lower-cases strings only", () => {
  assert.equal(normalizeEmail("  Fan@Example.COM "), "fan@example.com");
  assert.equal(normalizeEmail(42), "");
  assert.equal(normalizeEmail(undefined), "");
});

test("isValidEmail accepts normal addresses and rejects malformed ones", () => {
  assert.equal(isValidEmail("listener@rhythmic.tunes"), true);
  assert.equal(isValidEmail(" Listener@Rhythmic.Tunes "), true);
  assert.equal(isValidEmail("no-at-sign.com"), false);
  assert.equal(isValidEmail("two@@example.com"), false);
  assert.equal(isValidEmail("spaces in@example.com"), false);
  assert.equal(isValidEmail({ $gt: "" }), false);
});

test("isNonEmptyString rejects blanks and non-strings", () => {
  assert.equal(isNonEmptyString("x"), true);
  assert.equal(isNonEmptyString("   "), false);
  assert.equal(isNonEmptyString(["x"]), false);
});

test("getPasswordError enforces presence and minimum length", () => {
  assert.equal(getPasswordError(""), "Password is required.");
  assert.equal(getPasswordError(undefined), "Password is required.");
  assert.match(getPasswordError("a".repeat(MIN_PASSWORD_LENGTH - 1)), /at least/);
  assert.equal(getPasswordError("a".repeat(MIN_PASSWORD_LENGTH)), null);
});

test("validateObjectIdParam rejects bad ids with 400 and passes good ones", () => {
  const middleware = validateObjectIdParam("id", "user");

  const badRes = createMockResponse();
  let calledNext = false;
  middleware({ params: { id: "not-an-id" } }, badRes, () => {
    calledNext = true;
  });
  assert.equal(calledNext, false);
  assert.equal(badRes.statusCode, 400);
  assert.deepEqual(badRes.body, { message: "Invalid user ID." });

  const goodRes = createMockResponse();
  middleware({ params: { id: new mongoose.Types.ObjectId().toString() } }, goodRes, () => {
    calledNext = true;
  });
  assert.equal(calledNext, true);
  assert.equal(goodRes.body, undefined);
});

test("getMissingEnvVars reports missing and blank required variables", () => {
  assert.deepEqual(getMissingEnvVars({}), ["MONGO_URI", "JWT_SECRET"]);
  assert.deepEqual(getMissingEnvVars({ MONGO_URI: "mongodb://x", JWT_SECRET: "  " }), [
    "JWT_SECRET",
  ]);
  assert.deepEqual(getMissingEnvVars({ MONGO_URI: "mongodb://x", JWT_SECRET: "s" }), []);
});

test("normalizeUsername keeps only a-z, 0-9 and _ up to 24 chars", () => {
  assert.equal(normalizeUsername("  DJ Cosmos!! "), "djcosmos");
  assert.equal(normalizeUsername("a".repeat(40)).length, 24);
});

test("createUsernameBase falls back from username to name to email to 'listener'", () => {
  assert.equal(createUsernameBase({ username: "Neo_1", name: "Ignored", email: "x@y.z" }), "neo_1");
  assert.equal(createUsernameBase({ name: "Luna Vega", email: "x@y.z" }), "lunavega");
  assert.equal(createUsernameBase({ email: "marcus.cole@example.com" }), "marcuscole");
  assert.equal(createUsernameBase({ name: "!!!", email: "" }), "listener");
});

test("isValidUsername matches the registration rules", () => {
  assert.equal(isValidUsername("Rico_Blaze"), true);
  assert.equal(isValidUsername("rico.blaze"), false);
  assert.equal(isValidUsername("a".repeat(25)), false);
  assert.equal(isValidUsername(""), false);
});
