import "@tanstack/react-start/server-only";

const value = process.env.DATABASE_URL || process.env["DATABASE_URL"] || process.env.DB_URL || process.env["DB_URL"];
if (!value) {
  throw new Error("DATABASE_URL or DB_URL must be set in Vercel Environment Variables");
}

export const DATABASE_URL = value;
