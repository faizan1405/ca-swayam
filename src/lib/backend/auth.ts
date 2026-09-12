/**
 * Authentication helpers for the admin panel.
 */

import bcrypt from "bcryptjs";
import { NODE_ENV, getSessionSecret } from "./env";
import { db, admins } from "./db";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = "swayam_admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
}

export interface SessionPayload extends AdminSession {
  issuedAt: number;
  expiresAt: number;
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
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const cryptoKey = await getSigningKey(["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, payloadBytes);
  return `${encodeBase64Url(payloadBytes)}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken(sessionToken: string): Promise<SessionPayload | null> {
  try {
    const parts = sessionToken.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const payloadBytes = decodeBase64Url(parts[0]);
    const signature = decodeBase64Url(parts[1]);
    if (!payloadBytes || !signature || signature.byteLength !== 32) return null;

    const cryptoKey = await getSigningKey(["verify"]);
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signature,
      payloadBytes,
    );
    if (!validSignature) return null;

    const payload: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (!isSessionPayload(payload)) return null;

    const now = Date.now();
    if (payload.issuedAt > now || payload.expiresAt <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

async function getSigningKey(keyUsages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    keyUsages,
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): ArrayBuffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (base64.length % 4)) % 4;
  const binary = atob(base64 + "=".repeat(paddingLength));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload["adminId"] === "string" &&
    payload["adminId"].length > 0 &&
    typeof payload["email"] === "string" &&
    typeof payload["name"] === "string" &&
    typeof payload["issuedAt"] === "number" &&
    Number.isFinite(payload["issuedAt"]) &&
    typeof payload["expiresAt"] === "number" &&
    Number.isFinite(payload["expiresAt"]) &&
    payload["expiresAt"] - payload["issuedAt"] === SESSION_MAX_AGE_MS
  );
}

// ─── Session management ──────────────────────────────────────────────────────

export async function createSession(adminId: string): Promise<string> {
  const [admin] = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
  if (!admin) throw new Error("Admin not found");

  const issuedAt = Date.now();
  const payload: SessionPayload = {
    adminId,
    email: admin.email,
    name: admin.name,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_MS,
  };

  return signToken(payload);
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  const encodedToken = match?.[1];
  if (!encodedToken) return null;

  const session = await verifyToken(encodedToken);
  if (!session) return null;

  // Keep authorization tied to a live admin record and return current profile
  // details instead of stale values embedded in an older signed cookie.
  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin) return null;

  return {
    ...session,
    email: admin.email,
    name: admin.name,
  };
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function setCookieHeader(sessionToken: string): string {
  const maxAge = Math.floor(SESSION_MAX_AGE_MS / 1000);
  const secure = NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearCookieHeader(): string {
  const secure = NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
