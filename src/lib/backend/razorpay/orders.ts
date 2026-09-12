import { createServerFn } from "@tanstack/react-start";
import Razorpay from "razorpay";
import { z } from "zod";
import { getRazorpayKeyId, getRazorpayKeySecret } from "./env";
import { buildServerRequest, serverRequestInputSchema } from "../server-request";
import { db, consultations, consultationFormats } from "../db";
import { eq } from "drizzle-orm";



const createOrderInputSchema = z.object({
  consultationId: z.string().min(1),
});

async function createPaymentOrderHandler(request: Request) {
  const keyId = getRazorpayKeyId();
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: getRazorpayKeySecret(),
  });
  
  const body = await request.json();
  const parsed = createOrderInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { consultationId } = parsed.data;

  const [consultation] = await db
    .select({
      id: consultations.id,
      name: consultations.name,
      contact: consultations.contact,
      email: consultations.email,
      formatId: consultations.formatId,
      date: consultations.date,
      time: consultations.time,
      note: consultations.note,
      status: consultations.status,
      paymentStatus: consultations.paymentStatus,
    })
    .from(consultations)
    .where(eq(consultations.id, consultationId))
    .limit(1);

  if (!consultation) {
    return Response.json({ error: "Consultation not found" }, { status: 404 });
  }

  if (consultation.status === "confirmed" || consultation.paymentStatus === "paid") {
    return Response.json({ error: "Consultation is already paid or confirmed" }, { status: 400 });
  }

  if (!consultation.formatId) {
    return Response.json({ error: "Invalid consultation format" }, { status: 400 });
  }

  const [format] = await db
    .select()
    .from(consultationFormats)
    .where(eq(consultationFormats.id, consultation.formatId))
    .limit(1);

  if (!format) {
    return Response.json({ error: "Invalid consultation format" }, { status: 400 });
  }

  const amount = format.fee * 100;

  const preferredDate = typeof consultation.date === "string"
    ? consultation.date
    : new Date(consultation.date).toISOString().split("T")[0]!;

  const receipt = `consult_${consultation.id}_${Date.now()}`;
  const notes: Record<string, string> = {
    consultationId: consultation.id,
    name: consultation.name,
    phone: consultation.contact,
    consultationType: format.name,
    preferredDate,
    preferredTime: consultation.time,
  };
  if (consultation.email) {
    notes["email"] = consultation.email;
  }
  if (consultation.note) {
    notes["note"] = consultation.note;
  }

  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes,
    });
    razorpayOrder = {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  } catch (error) {
    console.error("[Razorpay] Failed to create order:", error);
    return Response.json({ error: "Failed to create payment order. Please try again." }, { status: 500 });
  }

  const now = new Date();
  await db
    .update(consultations)
    .set({
      razorpayOrderId: razorpayOrder.id,
      updatedAt: now,
    })
    .where(eq(consultations.id, consultation.id));

  const responseBody: Record<string, unknown> = {
    keyId: keyId,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: consultation.name,
    phone: consultation.contact,
    consultationType: format.name,
    preferredDate,
    preferredTime: consultation.time,
    note: consultation.note ?? "",
    amountDisplay: format.fee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    consultationId: consultation.id,
  };

  if (consultation.email) {
    responseBody["email"] = consultation.email;
  }

  return Response.json(responseBody);
}

export const createPaymentOrder = createServerFn({ method: "POST" })
  .validator(serverRequestInputSchema)
  .handler(({ data }) => createPaymentOrderHandler(buildServerRequest("POST", data)));
