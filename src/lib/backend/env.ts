/** Server-only session environment configuration. */
export const SESSION_SECRET = (() => {
  const value = process.env.SESSION_SECRET || process.env["SESSION_SECRET"];
  if (!value) throw new Error("SESSION_SECRET must be set");
  if ((process.env.NODE_ENV || process.env["NODE_ENV"]) === "production" && value.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  return value;
})();

export const NODE_ENV = process.env.NODE_ENV || process.env["NODE_ENV"] || "development";
