import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/backend/db/schema.ts",
  out: "./src/lib/backend/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"]!,
  },
});
