import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, services } from "../db";
import { insertServiceSchema } from "../db/schema";
import { getSession } from "../auth";

// ─── Query Helpers ──────────────────────────────────────────────────────────

export async function getAllServices(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await db.select().from(services).orderBy(services.sortOrder);
  return Response.json(all);
}

export async function getServiceById(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const [result] = await db.select().from(services).where(eq(services.id, id));
  if (!result) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(result);
}

export async function createService(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = insertServiceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const id = "svc_" + Math.random().toString(36).slice(2);
  const [result] = await db
    .insert(services)
    .values({
      ...parsed.data,
      id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return Response.json(result, { status: 201 });
}

export async function updateService(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = insertServiceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [result] = await db
    .update(services)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();

  return Response.json(result);
}

export async function deleteService(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  await db.delete(services).where(eq(services.id, id));
  return new Response(null, { status: 204 });
}

// ─── Public (no auth) ────────────────────────────────────────────────────────

export async function getPublicServices() {
  const all = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder);
  return Response.json(all);
}
