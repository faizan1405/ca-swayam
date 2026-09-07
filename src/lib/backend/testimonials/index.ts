import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, testimonials, insertTestimonialSchema } from "../db";
import { getSession } from "../auth";

export async function getAllTestimonials(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(testimonials).orderBy(testimonials.sortOrder);
  return Response.json(all);
}

export async function getTestimonialById(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const [result] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result);
}

export async function createTestimonial(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createTestimonialSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const id = "tst_" + Math.random().toString(36).slice(2);
  const now = new Date();
  const [result] = await db
    .insert(testimonials)
    .values({
      ...parsed.data,
      id,
      createdAt: now,
      updatedAt: now,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  return Response.json(result, { status: 201 });
}

export async function updateTestimonial(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json();
  const parsed = createTestimonialSchema.partial().safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [result] = await db
    .update(testimonials)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(testimonials.id, id))
    .returning();

  return Response.json(result);
}

export async function deleteTestimonial(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(testimonials).where(eq(testimonials.id, id));
  return new Response(null, { status: 204 });
}

// ─── Public (no auth) ────────────────────────────────────────────────────────

export async function getPublicTestimonials() {
  const all = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isActive, true))
    .orderBy(testimonials.sortOrder);
  return Response.json(all);
}

const createTestimonialSchema = insertTestimonialSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
