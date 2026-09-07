/**
 * Admin server functions for authentication and admin management.
 */

import { z } from "zod";
import bcrypt from "bcryptjs";

import { db, admins, services, testimonials, consultations, contactEntries } from "../db";
import { eq, sql } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  getSession,
  createSession,
  clearCookieHeader,
  setCookieHeader,
} from "../auth";
import { SESSION_SECRET } from "../env";

// ─── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const updateAdminSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// ─── Login ──────────────────────────────────────────────────────────────────

export async function adminLogin(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = await db.query.admins.findFirst({
    where: (a, { eq }) => eq(a.email, parsed.data.email),
  });

  if (!admin) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Update last login
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));

  const sessionToken = await createSession(admin.id);
  const cookie = setCookieHeader(sessionToken);

  return new Response(
    Response.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
      .body,
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Set-Cookie": cookie,
      },
    },
  );
}

// ─── Logout ─────────────────────────────────────────────────────────────────

export async function adminLogout() {
  const cookie = clearCookieHeader();
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie },
  });
}

// ─── Get current session ────────────────────────────────────────────────────

export async function getAdminSession(request: Request) {
  const session = await getSession(request);
  return session ? { id: session.id, email: session.email, name: session.name } : null;
}

// ─── Change password ────────────────────────────────────────────────────────

export async function changePassword(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = await db.query.admins.findFirst({
    where: (a, { eq }) => eq(a.id, session.id),
  });

  if (!admin) {
    return Response.json({ error: "Admin not found" }, { status: 404 });
  }

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.update(admins).set({ passwordHash: newHash }).where(eq(admins.id, admin.id));

  return Response.json({ success: true });
}

// ─── Update admin profile ───────────────────────────────────────────────────

export async function updateAdminProfile(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = updateAdminSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: { name?: string; email?: string } = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.email) {
    // Check email is not taken by another admin
    const existing = await db.query.admins.findFirst({
      where: (a, { eq }) => eq(a.email, parsed.data.email!),
    });
    if (existing && existing.id !== session.id) {
      return Response.json({ error: "Email already in use" }, { status: 400 });
    }
    updates.email = parsed.data.email;
  }

  const result = await db.update(admins).set(updates).where(eq(admins.id, session.id)).returning();
  const row = result[0];
  if (!row) {
    return Response.json({ error: "Admin not found" }, { status: 404 });
  }
  const { passwordHash, ...safe } = row;
  return Response.json(safe);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

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
