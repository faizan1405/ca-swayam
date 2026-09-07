/**
 * Environment variables for the server-side runtime.
 * Loaded by TanStack Start's VITE_* injection and by Node.js directly.
 */
export const SESSION_SECRET = (() => {
  const value = process.env["SESSION_SECRET"];
  if (!value || value === "change-me-in-production") {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    return "change-me-in-development-only";
  }
  return value;
})();
export const DATABASE_PATH = process.env["DATABASE_PATH"] ?? "./src/lib/backend/db/swayam.sqlite";
export const NODE_ENV = process.env["NODE_ENV"] ?? "development";
export const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@swayamgoyal.com";
export const ADMIN_PASSWORD = (() => {
  const value = process.env["ADMIN_PASSWORD"];
  if (!value) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("ADMIN_PASSWORD must be set in production");
    }
    // No hardcoded fallback — require explicit configuration
    throw new Error(
      "ADMIN_PASSWORD is not set. Export it before running the app, e.g. ADMIN_PASSWORD=secure-pass npm run dev",
    );
  }
  return value;
})();
export const ADMIN_NAME = process.env["ADMIN_NAME"] ?? "Admin";
