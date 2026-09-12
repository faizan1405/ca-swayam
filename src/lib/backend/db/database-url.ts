import "@tanstack/react-start/server-only";

export function getDatabaseUrl() {
  const value = process.env["DATABASE_URL"];
  if (!value) {
    throw new Error("DATABASE_URL must be set");
  }
  return value;
}
