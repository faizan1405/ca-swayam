ALTER TABLE "consultations" ALTER COLUMN "status" SET DEFAULT 'pending_payment';--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "razorpay_order_id" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "razorpay_payment_id" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "payment_status" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "payment_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "currency" text DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "amount_paid" integer;