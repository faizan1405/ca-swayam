import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { db, consultations } from "../db";
import { RAZORPAY_KEY_SECRET } from "./env";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";
import { eq } from "drizzle-orm";

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  consultationId: z.string().min(1),
});

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result === 0;
}

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  try {
    const payload = `${orderId}|${paymentId}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(RAZORPAY_KEY_SECRET);
    const payloadData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      payloadData,
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const sigA = new TextEncoder().encode(signature);
    const sigB = new TextEncoder().encode(expectedSignature);

    if (sigA.length !== sigB.length) return false;

    return timingSafeEqual(sigA, sigB);
  } catch {
    return false;
  }
}

async function verifyPaymentHandler(request: Request) {
  const body = await request.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payment data" }, { status: 400 });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, consultationId } =
    parsed.data;

  const [consultation] = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, consultationId))
    .limit(1);

  if (!consultation) {
    return Response.json({ error: "Consultation not found" }, { status: 404 });
  }

  const serverOrderId = consultation.razorpayOrderId;
  if (!serverOrderId) {
    return Response.json({ error: "No Razorpay order associated with this consultation" }, { status: 400 });
  }

  if (serverOrderId !== razorpay_order_id) {
    return Response.json({ error: "Order ID mismatch" }, { status: 400 });
  }

  const signatureValid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!signatureValid) {
    return Response.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const now = new Date();
  const [updated] = await db
    .update(consultations)
    .set({
      paymentStatus: "paid",
      status: "confirmed",
      amountPaid: consultation.fee ? consultation.fee * 100 : null,
      razorpayPaymentId: razorpay_payment_id,
      paymentVerifiedAt: now,
      updatedAt: now,
    })
    .where(eq(consultations.id, consultationId))
    .returning();

  if (!updated) {
    return Response.json({ error: "Failed to update consultation" }, { status: 500 });
  }

  return Response.json({
    success: true,
    paymentStatus: updated.paymentStatus,
    consultationId: updated.id,
  });
}

export const verifyPayment = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => verifyPaymentHandler(buildServerRequest("POST", data)));
