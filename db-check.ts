import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { consultationFormats } from "./src/lib/backend/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  try {
    const formats = await db.select().from(consultationFormats);
    console.log("FORMATS IN NEON DB:");
    console.log(JSON.stringify(formats, null, 2));
    if (formats.length === 0) {
      console.log("No formats found. The table is empty!");
    }
  } catch (error) {
    console.error("Error querying db:", error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
