/**
 * Admin server functions for authentication and admin management.
 */

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { db, admins, services, testimonials, consultations, contactEntries } from "../db";
import { count, eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  getSession,
  createSession,
  clearCookieHeader,
  setCookieHeader,
} from "../auth";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";

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

async function adminLoginHandler(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [admin] = await db.select().from(admins).where(eq(admins.email, parsed.data.email)).limit(1);

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

async function adminLogoutHandler() {
  const cookie = clearCookieHeader();
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie },
  });
}

// ─── Get current session ────────────────────────────────────────────────────

async function getAdminSessionHandler(request: Request) {
  const session = await getSession(request);
  return session
    ? { adminId: session.adminId, email: session.email, name: session.name }
    : null;
}

// ─── Change password ────────────────────────────────────────────────────────

async function changePasswordHandler(request: Request) {
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

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);

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

async function updateAdminProfileHandler(request: Request) {
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

  const updates: { name?: string; email?: string; passwordHash?: string } = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.email) {
    // Check email is not taken by another admin
    const [existing] = await db.select().from(admins).where(eq(admins.email, parsed.data.email!)).limit(1);
    if (existing && existing.id !== session.adminId) {
      return Response.json({ error: "Email already in use" }, { status: 400 });
    }
    updates.email = parsed.data.email;
  }

  const result = await db
    .update(admins)
    .set(updates)
    .where(eq(admins.id, session.adminId))
    .returning();
  const row = result[0];
  if (!row) {
    return Response.json({ error: "Admin not found" }, { status: 404 });
  }
  const { passwordHash, ...safe } = row;
  return Response.json(safe);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

async function getAdminStatsHandler(request: Request) {
  const session = await getSession(request);
  if (!session) throw Response.json({ error: "Unauthorized" }, { status: 401 });

  const [servicesCount] = await db.select({ count: count() }).from(services);
  const [testimonialsCount] = await db.select({ count: count() }).from(testimonials);
  const [pendingCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "pending"));
  const [confirmedCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "confirmed"));

  const [contactTotal] = await db.select({ count: count() }).from(contactEntries);
  const [contactUnread] = await db
    .select({ count: count() })
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

export const adminLogin = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => adminLoginHandler(buildServerRequest("POST", data)));

export const adminLogout = createServerFn({ method: "POST" }).handler(() =>
  adminLogoutHandler(),
);

export const getAdminSession = createServerFn({ method: "GET" }).handler(() =>
  getAdminSessionHandler(buildServerRequest("GET")),
);

export const changePassword = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => changePasswordHandler(buildServerRequest("POST", data)));

export const updateAdminProfile = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => updateAdminProfileHandler(buildServerRequest("POST", data)));

export const getAdminStats = createServerFn({ method: "GET" }).handler(() =>
  getAdminStatsHandler(buildServerRequest("GET")),
);
