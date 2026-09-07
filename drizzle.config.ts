import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/backend/db/schema.ts",
  out: "./src/lib/backend/db/migrations",
  dialect: "sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./src/lib/backend/db/swayam.sqlite",
  },
});
