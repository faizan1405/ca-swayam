import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { db, consultations, consultationFormats } from "../db";
import { getSession } from "../auth";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";

// Public submit (no auth) — used by the consultation page
async function submitConsultationHandler(request: Request) {
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

  const consultationDate = new Date(parsed.data.date);
  if (Number.isNaN(consultationDate.getTime())) {
    return Response.json({ error: "Invalid consultation date" }, { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (consultationDate < today) {
    return Response.json({ error: "Consultation date cannot be in the past" }, { status: 400 });
  }

  const duplicateWindow = new Date(Date.now() - 60_000);
  const [recentDuplicate] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        eq(consultations.contact, parsed.data.contact),
        eq(consultations.formatId, parsed.data.formatId),
        eq(consultations.date, consultationDate),
        eq(consultations.time, parsed.data.time),
        gte(consultations.createdAt, duplicateWindow),
      ),
    )
    .limit(1);
  if (recentDuplicate) {
    return Response.json(
      { error: "This consultation request was already submitted. Please wait before trying again." },
      { status: 429 },
    );
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
      date: consultationDate,
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
async function listConsultationsHandler(request: Request) {
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

async function getConsultationStatsHandler(request: Request) {
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
    .where(sql`${consultations.createdAt} >= date_trunc('day', now())`);

  return Response.json({
    total: all?.count ?? 0,
    pending: pending?.count ?? 0,
    confirmed: confirmed?.count ?? 0,
    completed: completed?.count ?? 0,
    cancelled: cancelled?.count ?? 0,
    today: todayRows?.count ?? 0,
  });
}

async function updateConsultationStatusHandler(request: Request) {
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

async function deleteConsultationHandler(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db.delete(consultations).where(eq(consultations.id, id));
  return new Response(null, { status: 204 });
}

async function listFormatsHandler() {
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

export const submitConsultation = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => submitConsultationHandler(buildServerRequest("POST", data)));

export const listConsultations = createServerFn({ method: "GET" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => listConsultationsHandler(buildServerRequest("GET", data)));

export const getConsultationStats = createServerFn({ method: "GET" }).handler(() =>
  getConsultationStatsHandler(buildServerRequest("GET")),
);

export const updateConsultationStatus = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => updateConsultationStatusHandler(buildServerRequest("POST", data)));

export const deleteConsultation = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => deleteConsultationHandler(buildServerRequest("POST", data)));

export const listFormats = createServerFn({ method: "GET" }).handler(() =>
  listFormatsHandler(),
);
