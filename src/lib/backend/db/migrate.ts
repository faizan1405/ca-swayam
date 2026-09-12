import "@tanstack/react-start/server-only";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./database-url";

const client = postgres(getDatabaseUrl(), { max: 1, connect_timeout: 10, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: "./src/lib/backend/db/migrations" });
  console.log("PostgreSQL migrations complete.");
} finally {
  await client.end();
}
