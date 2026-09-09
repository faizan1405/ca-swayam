CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "consultation_formats" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"duration" text NOT NULL,
	"fee" integer NOT NULL,
	"note" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"format_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"time" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"preferred_date" timestamp with time zone NOT NULL,
	"preferred_time" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"items" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_info" (
	"id" text PRIMARY KEY NOT NULL,
	"business_name" text DEFAULT 'Swayam Goyal & Associates' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"about_text" text DEFAULT '' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"facebook" text DEFAULT '' NOT NULL,
	"linkedin" text DEFAULT '' NOT NULL,
	"youtube" text DEFAULT '' NOT NULL,
	"business_hours" text DEFAULT '' NOT NULL,
	"hero_heading" text DEFAULT '' NOT NULL,
	"hero_subtext" text DEFAULT '' NOT NULL,
	"hero_description" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"name" text NOT NULL,
	"place" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_format_id_consultation_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."consultation_formats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "consult_formats_sort_order_idx" ON "consultation_formats" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "consultations_status_idx" ON "consultations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consultations_created_at_idx" ON "consultations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_entries_created_at_idx" ON "contact_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_entries_is_read_idx" ON "contact_entries" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "services_sort_order_idx" ON "services" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "testimonials_sort_order_idx" ON "testimonials" USING btree ("sort_order");