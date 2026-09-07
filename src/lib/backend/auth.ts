/**
 * Authentication helpers for the admin panel.
 */

import bcrypt from "bcryptjs";
import { SESSION_SECRET } from "./env";
import { db, admins } from "./db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = "swayam_admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminSession {
  id: string;
  email: string;
  name: string;
}

interface SessionPayload {
  adminId: string;
  email: string;
  name: string;
  issuedAt: number;
}

// ─── Password ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Token helpers ───────────────────────────────────────────────────────────

async function signToken(payload: SessionPayload): Promise<string> {
  const data = JSON.stringify(payload);
  const key = new TextEncoder().encode(SESSION_SECRET);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
    return sigB64 + "." + btoa(data);
  } catch {
    // Fallback for Node < 19 / no WebCrypto
    return btoa(data + "|" + SESSION_SECRET);
  }
}

async function verifyToken(sessionToken: string): Promise<SessionPayload | null> {
  try {
    const dotIndex = sessionToken.indexOf(".");
    if (dotIndex === -1) return null;
    const payloadStr = atob(sessionToken.slice(dotIndex + 1));
    return JSON.parse(payloadStr) as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Session management ──────────────────────────────────────────────────────

export async function createSession(adminId: string): Promise<string> {
  const [admin] = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
  if (!admin) throw new Error("Admin not found");

  const payload: SessionPayload = {
    adminId,
    email: admin.email,
    name: admin.name,
    issuedAt: Date.now(),
  };

  return signToken(payload);
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const token = decodeURIComponent(match[1]);
  const payload = await verifyToken(token);

  if (!payload) return null;

  // Check expiry
  if (Date.now() - payload.issuedAt > SESSION_MAX_AGE_MS) {
    return null;
  }

  return payload;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function setCookieHeader(sessionToken: string): string {
  const maxAge = Math.floor(SESSION_MAX_AGE_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
