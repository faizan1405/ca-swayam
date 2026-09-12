ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "razorpay_order_id" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_status" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "amount_paid" integer;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP INDEX IF EXISTS "consultations_status_idx";--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "status" TYPE text;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "status" SET DEFAULT 'pending_payment';--> statement-breakpoint
CREATE INDEX "consultations_status_idx" ON "consultations" USING btree ("status");--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_status_check" CHECK ("status" IN ('pending_payment','pending','confirmed','cancelled','completed','payment_failed'));
