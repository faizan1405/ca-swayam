import "@tanstack/react-start/server-only";

const value = process.env["DATABASE_URL"];
if (!value) {
  throw new Error("DATABASE_URL must be set");
}

export const DATABASE_URL = value;
