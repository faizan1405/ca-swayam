import { eq } from "drizzle-orm";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { db, testimonials, insertTestimonialSchema } from "../db";
import { getSession } from "../auth";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";

async function getAllTestimonialsHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(testimonials).orderBy(testimonials.sortOrder);
  return Response.json(all);
}

async function getTestimonialByIdHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const [result] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result);
}

async function createTestimonialHandler(request: Request) {
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

async function updateTestimonialHandler(request: Request) {
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

async function deleteTestimonialHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(testimonials).where(eq(testimonials.id, id));
  return new Response(null, { status: 204 });
}

// ─── Public (no auth) ────────────────────────────────────────────────────────

async function getPublicTestimonialsHandler() {
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

export const getAllTestimonials = createServerFn({ method: "GET" }).handler(() =>
  getAllTestimonialsHandler(buildServerRequest("GET")),
);

export const getTestimonialById = createServerFn({ method: "GET" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => getTestimonialByIdHandler(buildServerRequest("GET", data)));

export const createTestimonial = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => createTestimonialHandler(buildServerRequest("POST", data)));

export const updateTestimonial = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => updateTestimonialHandler(buildServerRequest("POST", data)));

export const deleteTestimonial = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => deleteTestimonialHandler(buildServerRequest("POST", data)));

export const getPublicTestimonials = createServerFn({ method: "GET" }).handler(() =>
  getPublicTestimonialsHandler(),
);
