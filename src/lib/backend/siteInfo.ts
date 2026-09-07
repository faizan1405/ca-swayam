/**
 * Server functions for site information management (admin-only).
 *
 * The public website uses getPublicSiteInfo() to fetch current values.
 */

import { z } from "zod";

import { db, siteInfo } from "./db";
import { eq } from "drizzle-orm";

import { getSession } from "./auth";
import type { AdminSession } from "./auth";

// ─── Schema ─────────────────────────────────────────────────────────────────

const siteInfoUpdateSchema = z.object({
  businessName: z.string().optional(),
  tagline: z.string().optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  aboutText: z.string().optional(),
  shortDescription: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  businessHours: z.string().optional(),
  heroHeading: z.string().optional(),
  heroSubtext: z.string().optional(),
  heroDescription: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Admin: Get ─────────────────────────────────────────────────────────────

export async function getSiteInfo(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [result] = await db.select().from(siteInfo).where(eq(siteInfo.id, "site"));
  if (!result) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(result);
}

// ─── Admin: Update ──────────────────────────────────────────────────────────

export async function updateSiteInfo(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = siteInfoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db.select().from(siteInfo).where(eq(siteInfo.id, "site"));

  if (!existing) {
    const now = new Date();
    const [result] = await db.insert(siteInfo).values({
      id: "site",
      businessName: parsed.data.businessName ?? "",
      tagline: parsed.data.tagline ?? "",
      ownerName: parsed.data.ownerName ?? "",
      phone: parsed.data.phone ?? "",
      whatsapp: parsed.data.whatsapp ?? "",
      email: parsed.data.email ?? "",
      address: parsed.data.address ?? "",
      aboutText: parsed.data.aboutText ?? "",
      shortDescription: parsed.data.shortDescription ?? "",
      instagram: parsed.data.instagram ?? "",
      facebook: parsed.data.facebook ?? "",
      linkedin: parsed.data.linkedin ?? "",
      youtube: parsed.data.youtube ?? "",
      businessHours: parsed.data.businessHours ?? "",
      heroHeading: parsed.data.heroHeading ?? "",
      heroSubtext: parsed.data.heroSubtext ?? "",
      heroDescription: parsed.data.heroDescription ?? "",
      createdAt: now,
      updatedAt: now,
    }).returning();
    return Response.json(result);
  }

  const [result] = await db
    .update(siteInfo)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(siteInfo.id, "site"))
    .returning();

  return Response.json(result);
}

// ─── Public: Get (no auth) ──────────────────────────────────────────────────

export async function getPublicSiteInfo() {
  const [result] = await db.select().from(siteInfo).where(eq(siteInfo.id, "site"));
  return Response.json(result ?? null);
}

// ─── Admin: Update availability status ─────────────────────────────────────

export async function updateAvailabilityStatus(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.isActive !== "boolean") {
    return Response.json({ error: "isActive boolean is required" }, { status: 400 });
  }

  const [result] = await db
    .update(siteInfo)
    .set({ isActive: body.isActive, updatedAt: new Date() })
    .where(eq(siteInfo.id, "site"))
    .returning();

  return Response.json(result);
}
