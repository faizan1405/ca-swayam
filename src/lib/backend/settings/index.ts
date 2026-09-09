import { eq } from "drizzle-orm";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { db, siteSettings } from "../db";
import { getSession } from "../auth";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";

async function getAllSettingsHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(siteSettings);
  const result: Record<string, { value: string; type: string }> = {};
  for (const row of all) {
    result[row.key] = { value: row.value, type: row.type };
  }
  return Response.json(result);
}

async function updateSettingHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  const body = await request.json();
  const parsed = settingUpdateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [result] = await db
    .update(siteSettings)
    .set({ value: parsed.data.value, type: parsed.data.type ?? "text", updatedAt: new Date() })
    .where(eq(siteSettings.key, key))
    .returning();

  return Response.json(result);
}

async function getPublicSettingsHandler() {
  // No auth — public site can read these
  const all = await db.select().from(siteSettings);
  const result: Record<string, { value: string; type: string }> = {};
  for (const row of all) {
    result[row.key] = { value: row.value, type: row.type };
  }
  return Response.json(result);
}

const settingUpdateSchema = z.object({
  value: z.string().min(1),
  type: z.enum(["text", "number", "boolean", "json"]).optional(),
});

export const getAllSettings = createServerFn({ method: "GET" }).handler(() =>
  getAllSettingsHandler(buildServerRequest("GET")),
);

export const updateSetting = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => updateSettingHandler(buildServerRequest("POST", data)));

export const getPublicSettings = createServerFn({ method: "GET" }).handler(() =>
  getPublicSettingsHandler(),
);
