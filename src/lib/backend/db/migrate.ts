import "@tanstack/react-start/server-only";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL } from "./database-url";

const client = postgres(DATABASE_URL, { max: 1, connect_timeout: 10, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: "./src/lib/backend/db/migrations" });
  console.log("PostgreSQL migrations complete.");
} finally {
  await client.end();
}
