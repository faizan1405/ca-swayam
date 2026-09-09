/**
 * Server functions for managing services (admin-only).
 *
 * These run on the server via TanStack Start's createServerFn.
 * All mutations are protected by backend session checks.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db, services, contactEntries, insertServiceSchema } from "./db";
import { getSession } from "./auth";
import { buildServerRequest, serverRequestInputSchema } from "./server-request";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function ensureAdmin(request: Request) {
  return getSession(request);
}

const createServiceSchema = insertServiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateServiceSchema = createServiceSchema.partial();

// ─── Services: List ─────────────────────────────────────────────────────────

async function getAllServicesHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(services).orderBy(services.sortOrder, services.number);
  return Response.json(all);
}

// ─── Services: Create ───────────────────────────────────────────────────────

async function createServiceHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const [result] = await db.insert(services).values({
    ...parsed.data,
    id: `svc_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return Response.json(result, { status: 201 });
}

// ─── Services: Update ───────────────────────────────────────────────────────

async function updateServiceHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = updateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [result] = await db
    .update(services)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();

  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result);
}

// ─── Services: Delete ───────────────────────────────────────────────────────

async function deleteServiceHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(services).where(eq(services.id, id));
  return new Response(null, { status: 204 });
}

// ─── Services: Public (no auth) ─────────────────────────────────────────────

async function getPublicServicesHandler() {
  const all = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder, services.number);
  return Response.json(all);
}

// ─── Contact Entries: Public Submit ─────────────────────────────────────────

async function submitContactEntryHandler(request: Request) {
  // Public endpoint — no auth required
  const body = await request.json();
  const parsed = contactEntrySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Validate date is not in the past
  const entryDate = new Date(parsed.data.preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (entryDate < today) {
    return Response.json({ error: "Preferred date cannot be in the past" }, { status: 400 });
  }

  const duplicateWindow = new Date(Date.now() - 60_000);
  const [recentDuplicate] = await db
    .select({ id: contactEntries.id })
    .from(contactEntries)
    .where(
      and(
        eq(contactEntries.email, parsed.data.email),
        eq(contactEntries.phone, parsed.data.phone),
        eq(contactEntries.message, parsed.data.message),
        gte(contactEntries.createdAt, duplicateWindow),
      ),
    )
    .limit(1);
  if (recentDuplicate) {
    return Response.json(
      { error: "This enquiry was already submitted. Please wait before trying again." },
      { status: 429 },
    );
  }

  const id = `cnt_${crypto.randomUUID()}`;
  const now = new Date();
  const [result] = await db
    .insert(contactEntries)
    .values({
      id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      preferredDate: new Date(parsed.data.preferredDate),
      preferredTime: parsed.data.preferredTime,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return Response.json(result, { status: 201 });
}

// ─── Contact Entries: Admin ──────────────────────────────────────────────────

async function getAllContactEntriesHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select()
    .from(contactEntries)
    .orderBy(desc(contactEntries.createdAt));

  return Response.json(all);
}

async function deleteContactEntryHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(contactEntries).where(eq(contactEntries.id, id));
  return new Response(null, { status: 204 });
}

async function markContactEntryReadHandler(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const [result] = await db
    .update(contactEntries)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(contactEntries.id, id))
    .returning();

  return Response.json(result);
}

const contactEntrySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .regex(/^\+?[\d\s()-]+$/, "Please enter a valid phone number"),
  message: z.string().min(1).max(5000),
  preferredDate: z.coerce.date(),
  preferredTime: z.string().min(1).max(50),
});

export const getAllServices = createServerFn({ method: "GET" }).handler(() =>
  getAllServicesHandler(buildServerRequest("GET")),
);

export const createService = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => createServiceHandler(buildServerRequest("POST", data)));

export const updateService = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => updateServiceHandler(buildServerRequest("POST", data)));

export const deleteService = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => deleteServiceHandler(buildServerRequest("POST", data)));

export const getPublicServices = createServerFn({ method: "GET" }).handler(() =>
  getPublicServicesHandler(),
);

export const submitContactEntry = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => submitContactEntryHandler(buildServerRequest("POST", data)));

export const getAllContactEntries = createServerFn({ method: "GET" }).handler(() =>
  getAllContactEntriesHandler(buildServerRequest("GET")),
);

export const deleteContactEntry = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => deleteContactEntryHandler(buildServerRequest("POST", data)));

export const markContactEntryRead = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => markContactEntryReadHandler(buildServerRequest("POST", data)));

// ─── Admin Stats ─────────────────────────────────────────────────────────────
