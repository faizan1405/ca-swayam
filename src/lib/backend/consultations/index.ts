import { eq, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { db, consultations, consultationFormats } from "../db";
import { getSession } from "../auth";

// Public submit (no auth) — used by the consultation page
export async function submitConsultation(request: Request) {
  const body = await request.json();
  const parsed = consultationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify format exists
  const format = await db.query.consultationFormats.findFirst({
    where: (f, { eq }) => eq(f.id, parsed.data.formatId),
  });
  if (!format) {
    return Response.json({ error: "Invalid consultation format" }, { status: 400 });
  }

  const id = "cons_" + Math.random().toString(36).slice(2);
  const now = new Date();
  const [result] = await db
    .insert(consultations)
    .values({
      id,
      name: parsed.data.name,
      contact: parsed.data.contact,
      formatId: parsed.data.formatId,
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      status: "pending",
      note: parsed.data.note ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return Response.json(result, { status: 201 });
}

// Admin queries
export async function listConsultations(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const conditions = status
    ? [eq(consultations.status, status as "pending" | "confirmed" | "cancelled" | "completed")]
    : [];

  const rows = await db
    .select()
    .from(consultations)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(desc(consultations.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ count: count() }).from(consultations);
  return Response.json({ items: rows, total: total?.count ?? 0, page, limit });
}

export async function getConsultationStats(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [pending] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "pending"));
  const [confirmed] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "confirmed"));
  const [completed] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "completed"));
  const [cancelled] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "cancelled"));
  const [all] = await db.select({ count: count() }).from(consultations);

  const [todayRows] = await db
    .select({ count: count() })
    .from(consultations)
    .where(sql`date(${consultations.createdAt}) = date('now')`);

  return Response.json({
    total: all?.count ?? 0,
    pending: pending?.count ?? 0,
    confirmed: confirmed?.count ?? 0,
    completed: completed?.count ?? 0,
    cancelled: cancelled?.count ?? 0,
    today: todayRows?.count ?? 0,
  });
}

export async function updateConsultationStatus(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [result] = await db
    .update(consultations)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(consultations.id, id))
    .returning();

  return Response.json(result);
}

export async function deleteConsultation(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(consultations).where(eq(consultations.id, id));
  return new Response(null, { status: 204 });
}

export async function listFormats(request: Request) {
  // public — no auth
  const all = await db.select().from(consultationFormats).orderBy(consultationFormats.sortOrder);
  return Response.json(all.filter((f) => f.isActive));
}

const consultationSubmitSchema = z.object({
  name: z.string().min(1).max(255),
  contact: z.string().min(1).max(255),
  formatId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  note: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});
