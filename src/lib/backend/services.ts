/**
 * Server functions for managing services (admin-only).
 *
 * These run on the server via TanStack Start's createServerFn.
 * All mutations are protected by backend session checks.
 */

import { eq, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { db, services, admins, consultations, contactEntries, insertServiceSchema } from "./db";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function ensureAdmin(request: Request) {
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId) return null;
  const [admin] = await db.select().from(admins).where(eq(admins.id, sessionId));
  if (!admin) return null;
  return { id: admin.id, email: admin.email, name: admin.name };
}

// ─── Services: List ─────────────────────────────────────────────────────────

export async function getAllServices(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(services).orderBy(services.sortOrder, services.number);
  return Response.json(all);
}

// ─── Services: Create ───────────────────────────────────────────────────────

export async function createService(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = insertServiceSchema.safeParse({
    ...body,
    id: "svc_" + Math.random().toString(36).slice(2),
  });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const [result] = await db.insert(services).values({
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return Response.json(result, { status: 201 });
}

// ─── Services: Update ───────────────────────────────────────────────────────

export async function updateService(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const partialSchema = insertServiceSchema.partial();
  const parsed = partialSchema.safeParse(body);
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

export async function deleteService(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(services).where(eq(services.id, id));
  return new Response(null, { status: 204 });
}

// ─── Services: Public (no auth) ─────────────────────────────────────────────

export async function getPublicServices() {
  const all = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder, services.number);
  return Response.json(all);
}

// ─── Contact Entries: Public Submit ─────────────────────────────────────────

export async function submitContactEntry(request: Request) {
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

  const id = "cnt_" + Math.random().toString(36).slice(2);
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

export async function getAllContactEntries(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select()
    .from(contactEntries)
    .orderBy(desc(contactEntries.createdAt));

  return Response.json(all);
}

export async function deleteContactEntry(request: Request) {
  const session = await ensureAdmin(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(contactEntries).where(eq(contactEntries.id, id));
  return new Response(null, { status: 204 });
}

export async function markContactEntryRead(request: Request) {
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

export async function getAdminContactStats() {
  const [allCount] = await db.select({ count: count() }).from(contactEntries);
  const [unreadCount] = await db
    .select({ count: count() })
    .from(contactEntries)
    .where(eq(contactEntries.isRead, false));
  const [todayCount] = await db
    .select({ count: count() })
    .from(contactEntries)
    .where(sql`date(${contactEntries.createdAt}) = date('now')`);

  return {
    total: allCount?.count ?? 0,
    unread: unreadCount?.count ?? 0,
    today: todayCount?.count ?? 0,
  };
}

const contactEntrySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  message: z.string().min(1).max,
  preferredDate: z.coerce.date(),
  preferredTime: z.string().min(1),
});

// ─── Admin Stats ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [servicesCount] = await db.select({ count: sql<number>`count(*)` }).from(services);
  const [testimonialsCount] = await db.select({ count: sql<number>`count(*)` }).from(testimonials);
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(consultations)
    .where(eq(consultations.status, "pending"));
  const [confirmedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(consultations)
    .where(eq(consultations.status, "confirmed"));

  const [contactTotal] = await db.select({ count: sql<number>`count(*)` }).from(contactEntries);
  const [contactUnread] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactEntries)
    .where(eq(contactEntries.isRead, false));

  return {
    services: servicesCount?.count ?? 0,
    testimonials: testimonialsCount?.count ?? 0,
    pendingConsultations: pendingCount?.count ?? 0,
    confirmedConsultations: confirmedCount?.count ?? 0,
    contactTotal: contactTotal?.count ?? 0,
    contactUnread: contactUnread?.count ?? 0,
  };
}
