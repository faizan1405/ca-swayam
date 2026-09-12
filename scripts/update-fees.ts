import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/backend/db/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("Updating consultation formats by ID...");

  // Update fmt_phone
  await db
    .update(schema.consultationFormats)
    .set({
      name: "20-min Phone Call",
      shortName: "Phone Call",
      duration: "20 min",
      fee: 500,
    })
    .where(eq(schema.consultationFormats.id, "fmt_phone"));

  // Update fmt_video
  await db
    .update(schema.consultationFormats)
    .set({
      name: "45-min Video Call",
      shortName: "Video Call",
      duration: "45 min",
      fee: 1000,
    })
    .where(eq(schema.consultationFormats.id, "fmt_video"));

  // Update fmt_face to Subsidy Roadmap
  await db
    .update(schema.consultationFormats)
    .set({
      name: "Subsidy Roadmap Session (60 min)",
      shortName: "Roadmap Session",
      duration: "60 min",
      fee: 5000,
    })
    .where(eq(schema.consultationFormats.id, "fmt_face"));

  console.log("Checking current formats:");
  const all = await db.select().from(schema.consultationFormats);
  console.log(all);

  process.exit(0);
}

main().catch(console.error);
