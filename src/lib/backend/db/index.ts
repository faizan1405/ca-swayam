import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const DATABASE_URL = process.env["DATABASE_PATH"] || "./src/lib/backend/db/swayam.sqlite";

// Ensure the directory exists
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
try {
  mkdirSync(dirname(DATABASE_URL), { recursive: true });
} catch {
  // directory may already exist
}

const sqlite = new Database(DATABASE_URL);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export type DbType = typeof db;

export * from "./schema";
