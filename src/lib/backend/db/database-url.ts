import "@tanstack/react-start/server-only";

const value = process.env.DATABASE_URL || process.env["DATABASE_URL"];
if (!value) {
  console.error("CRITICAL ERROR: DATABASE_URL is undefined at runtime! process.env keys:", Object.keys(process.env).join(", "));
}

export const DATABASE_URL = value || "postgresql://dummy:dummy@dummy/dummy";
