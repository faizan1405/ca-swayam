ALTER TABLE "consultations" ALTER COLUMN "format_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "fee" integer;