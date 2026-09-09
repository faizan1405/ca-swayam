import "@tanstack/react-start/server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL } from "./database-url";
import * as schema from "./schema";

// Keep each warm serverless instance to one connection. Use the pooled URL
// supplied by the Vercel Marketplace integration when the provider offers one.
const client = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });

export type DbType = typeof db;

export * from "./schema";
