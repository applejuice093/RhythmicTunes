const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/User");
const {
  adminOnly,
  getBearerToken,
  optionalAuth,
  protect,
} = require("../middleware/authMiddleware");
const { errorHandler, getErrorStatus, notFound } = require("../middleware/errorHandler");

const SECRET = "test-secret";
process.env.JWT_SECRET = SECRET;

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

/** Replaces User.findById(...).select(...) with an in-memory lookup. */
const stubFindById = (t, users) => {
  t.mock.method(User, "findById", (id) => ({
    select: async () => users[id] || null,
  }));
};

const run = async (middleware, req) => {
  const res = createMockResponse();
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

test("getBearerToken parses the Authorization header", () => {
  assert.equal(getBearerToken("Bearer abc.def"), "abc.def");
  assert.equal(getBearerToken("bearer abc"), "abc");
  assert.equal(getBearerToken("  Bearer   abc  "), "abc");
  assert.equal(getBearerToken("Basic abc"), null);
  assert.equal(getBearerToken("Bearer"), null);
  assert.equal(getBearerToken("Bearer a b"), null);
  assert.equal(getBearerToken(undefined), null);
});

test("protect returns 401 when the token is missing", async () => {
  const { res, nextCalled } = await run(protect, { headers: {} });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /token missing/);
});

test("protect returns 401 'token expired' for expired JWTs", async () => {
  const token = jwt.sign({ id: "u1" }, SECRET, { expiresIn: -10 });
  const { res, nextCalled } = await run(protect, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /token expired/);
});

test("protect returns 401 'token invalid' for tokens signed with another secret", async () => {
  const token = jwt.sign({ id: "u1" }, "wrong-secret");
  const { res } = await run(protect, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /token invalid/);
});

test("protect returns 401 when the user no longer exists", async (t) => {
  stubFindById(t, {});
  const token = jwt.sign({ id: "ghost" }, SECRET);
  const { res, nextCalled } = await run(protect, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /user not found/);
});

test("protect attaches req.user and calls next for a valid token", async (t) => {
  const user = { _id: "u1", name: "Luna" };
  stubFindById(t, { u1: user });
  const req = { headers: { authorization: `Bearer ${jwt.sign({ id: "u1" }, SECRET)}` } };
  const { nextCalled } = await run(protect, req);
  assert.equal(nextCalled, true);
  assert.equal(req.user, user);
});

test("protect returns 500 when the user lookup fails", async (t) => {
  t.mock.method(User, "findById", () => ({
    select: async () => {
      throw new Error("db down");
    },
  }));
  const req = { headers: { authorization: `Bearer ${jwt.sign({ id: "u1" }, SECRET)}` } };
  const { res, nextCalled } = await run(protect, req);
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 500);
});

test("optionalAuth continues anonymously for missing or bad tokens", async () => {
  for (const headers of [{}, { authorization: "Bearer not-a-jwt" }]) {
    const req = { headers };
    const { nextCalled } = await run(optionalAuth, req);
    assert.equal(nextCalled, true);
    assert.equal(req.user, undefined);
  }
});

test("optionalAuth attaches req.user for a valid token", async (t) => {
  const user = { _id: "u2" };
  stubFindById(t, { u2: user });
  const req = { headers: { authorization: `Bearer ${jwt.sign({ id: "u2" }, SECRET)}` } };
  const { nextCalled } = await run(optionalAuth, req);
  assert.equal(nextCalled, true);
  assert.equal(req.user, user);
});

test("adminOnly allows admins and rejects everyone else with 403", async () => {
  assert.equal((await run(adminOnly, { user: { isAdmin: true } })).nextCalled, true);

  const { res, nextCalled } = await run(adminOnly, { user: { isAdmin: false } });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("getErrorStatus maps common errors to client status codes", () => {
  assert.equal(getErrorStatus(new multer.MulterError("LIMIT_FILE_SIZE")), 413);
  assert.equal(getErrorStatus(new multer.MulterError("LIMIT_UNEXPECTED_FILE")), 400);
  assert.equal(getErrorStatus({ type: "entity.parse.failed" }), 400);
  assert.equal(getErrorStatus({ name: "CastError" }), 400);
  assert.equal(getErrorStatus({ status: 404 }), 404);
  assert.equal(getErrorStatus({ status: 200 }), 500);
  assert.equal(getErrorStatus(new Error("boom")), 500);
});

test("errorHandler hides internal messages on 5xx and keeps them on 4xx", (t) => {
  t.mock.method(console, "error", () => {});

  const serverRes = createMockResponse();
  errorHandler(new Error("secret stack detail"), {}, serverRes, () => {});
  assert.equal(serverRes.statusCode, 500);
  assert.deepEqual(serverRes.body, { message: "Internal server error." });

  const clientError = Object.assign(new Error("Image format '.exe' not supported."), {
    status: 400,
  });
  const clientRes = createMockResponse();
  errorHandler(clientError, {}, clientRes, () => {});
  assert.equal(clientRes.statusCode, 400);
  assert.equal(clientRes.body.message, "Image format '.exe' not supported.");
});

test("notFound responds with a JSON 404", () => {
  const res = createMockResponse();
  notFound({ method: "GET", originalUrl: "/api/nope" }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: "Route not found: GET /api/nope" });
});
