const multer = require("multer");

/**
 * 404 handler for unknown /api routes so API clients always get JSON back
 * instead of Express's default HTML page.
 */
const notFound = (req, res) => {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Maps an error to the HTTP status code that should be returned.
 * Exported separately so the mapping can be unit tested without Express.
 */
const getErrorStatus = (err) => {
  if (err instanceof multer.MulterError) {
    return err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
  }

  // express.json() raises this for malformed request bodies.
  if (err.type === "entity.parse.failed") {
    return 400;
  }

  // Mongoose cast/validation errors are caused by bad client input.
  if (err.name === "CastError" || err.name === "ValidationError") {
    return 400;
  }

  const status = err.status || err.statusCode;
  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
};

/**
 * Final Express error handler. Returns `{ message }` JSON in the same shape the
 * controllers use, and hides internal error details for 5xx responses.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = getErrorStatus(err);

  if (status >= 500) {
    console.error(err);
  }

  let message = err.message || "Something went wrong.";
  if (err.type === "entity.parse.failed") {
    message = "Request body is not valid JSON.";
  } else if (status >= 500) {
    message = "Internal server error.";
  }

  return res.status(status).json({ message });
};

module.exports = {
  errorHandler,
  getErrorStatus,
  notFound,
};
