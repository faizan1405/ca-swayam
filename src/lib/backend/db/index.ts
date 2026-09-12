import "@tanstack/react-start/server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./database-url";
import * as schema from "./schema";

let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function initDb() {
  if (_db) return _db;
  const url = getDatabaseUrl();
  _client = postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

export type DbType = ReturnType<typeof drizzle>;

export const db = new Proxy({} as DbType, {
  get(target, prop) {
    return Reflect.get(initDb(), prop);
  }
});

export * from "./schema";
