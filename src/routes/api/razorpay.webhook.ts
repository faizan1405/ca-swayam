import { createFileRoute } from "@tanstack/react-router";
import { db, consultations } from "@/lib/backend/db";
import { getRazorpayWebhookSecret } from "@/lib/backend/razorpay/env";
import { eq } from "drizzle-orm";

// @ts-ignore - API route not in auto-generated FileRoutesByPath
export const Route = createFileRoute("/api/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const signature = request.headers.get("x-razorpay-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const payload = await request.text();

        const encoder = new TextEncoder();
        const keyData = encoder.encode(getRazorpayWebhookSecret());
        const payloadData = encoder.encode(payload);

        let isValidWebhook = false;
        try {
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
          if (sigA.length === sigB.length) {
            let result = 0;
            for (let i = 0; i < sigA.length; i++) {
              result |= (sigA[i] ?? 0) ^ (sigB[i] ?? 0);
            }
            isValidWebhook = result === 0;
          }
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }

        if (!isValidWebhook) {
          return new Response("Invalid webhook signature", { status: 400 });
        }

        let event: { event: string; payload: { order: { entity: { id: string } }; payment: { entity: { id: string; status: string; amount?: number } } } };
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const orderEntity = event.payload?.order?.entity;
        const orderId = orderEntity?.id;
        if (!orderId) {
          return new Response("No order ID in event", { status: 400 });
        }

        const [consultation] = await db
          .select()
          .from(consultations)
          .where(eq(consultations.razorpayOrderId, orderId))
          .limit(1);

        if (!consultation) {
          return new Response("Consultation not found", { status: 404 });
        }

        const eventType = event.event;

        if (
          eventType === "order.paid" ||
          eventType === "payment.captured"
        ) {
          if (consultation.paymentStatus === "paid") {
            return Response.json({ status: "already_processed" });
          }

          const paymentEntity = event.payload?.payment?.entity;
          const paymentId = paymentEntity?.id ?? "";
          const amountPaid = paymentEntity?.amount;

          await db
            .update(consultations)
            .set({
              paymentStatus: "paid",
              status: "confirmed",
              razorpayPaymentId: paymentId,
              amountPaid: amountPaid ? Number(amountPaid) : undefined,
              paymentVerifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(consultations.id, consultation.id));

          return Response.json({ status: "success" });
        }

        if (eventType === "payment.failed") {
          await db
            .update(consultations)
            .set({
              paymentStatus: "payment_failed",
              status: "payment_failed",
              updatedAt: new Date(),
            })
            .where(eq(consultations.id, consultation.id));

          return Response.json({ status: "marked_failed" });
        }

        return Response.json({ status: "ignored", event: eventType });
      },
    },
  },
});
