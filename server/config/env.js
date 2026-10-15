/**
 * Environment variables the API cannot run without.
 * See server/.env.example for descriptions and sample values.
 */
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET"];

/**
 * Returns the names of required variables that are missing or blank.
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
const getMissingEnvVars = (env = process.env) =>
  REQUIRED_ENV_VARS.filter((name) => !env[name] || !String(env[name]).trim());

/**
 * Exits the process with a readable message when required configuration is
 * missing, instead of failing later with an obscure Mongoose or JWT error.
 */
const assertRequiredEnv = (env = process.env) => {
  const missing = getMissingEnvVars(env);

  if (missing.length) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy server/.env.example to server/.env and fill in the values."
    );
    process.exit(1);
  }
};

module.exports = {
  REQUIRED_ENV_VARS,
  assertRequiredEnv,
  getMissingEnvVars,
};
