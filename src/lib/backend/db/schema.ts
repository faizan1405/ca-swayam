import { pgTable, text, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Admins ──────────────────────────────────────────────────────────────────
export const admins = pgTable(
  "admins",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("admins_email_idx").on(table.email),
  }),
);

export const insertAdminSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.coerce.date().optional(),
  lastLoginAt: z.coerce.date().optional(),
});
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

// ─── Services ────────────────────────────────────────────────────────────────
export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    items: jsonb("items").notNull().$type<string[]>(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sortOrderIdx: index("services_sort_order_idx").on(table.sortOrder),
  }),
);

export const insertServiceSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1),
  title: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  items: z.array(z.string()),
  sortOrder: z.coerce.number().optional(),
  isActive: z.coerce.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

// ─── Testimonials ────────────────────────────────────────────────────────────
export const testimonials = pgTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    quote: text("quote").notNull(),
    name: text("name").notNull(),
    place: text("place").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sortOrderIdx: index("testimonials_sort_order_idx").on(table.sortOrder),
  }),
);

export const insertTestimonialSchema = z.object({
  id: z.string().optional(),
  quote: z.string().min(1),
  name: z.string().min(1),
  place: z.string().min(1),
  sortOrder: z.coerce.number().optional(),
  isActive: z.coerce.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

// ─── Consultation Formats (static config) ───────────────────────────────────
export const consultationFormats = pgTable(
  "consultation_formats",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    duration: text("duration").notNull(),
    fee: integer("fee").notNull(),
    note: text("note").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => ({
    sortOrderIdx: index("consult_formats_sort_order_idx").on(table.sortOrder),
  }),
);

export const insertConsultationFormatSchema = createInsertSchema(consultationFormats);
export type ConsultationFormat = typeof consultationFormats.$inferSelect;
export type NewConsultationFormat = typeof consultationFormats.$inferInsert;

// ─── Consultations (bookings) ────────────────────────────────────────────────
export const consultations = pgTable(
  "consultations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    email: text("email"),
    formatId: text("format_id")
      .references(() => consultationFormats.id),
    fee: integer("fee"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    time: text("time").notNull(),
    status: text("status", { enum: ["pending", "confirmed", "cancelled", "completed"] })
      .notNull()
      .default("pending"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("consultations_status_idx").on(table.status),
    createdAtIdx: index("consultations_created_at_idx").on(table.createdAt),
  }),
);

export const insertConsultationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  contact: z.string().min(1),
  email: z.string().optional(),
  formatId: z.string().optional(),
  fee: z.coerce.number().optional(),
  date: z.coerce.date(),
  time: z.string(),
  status: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;

// ─── Contact Entries ─────────────────────────────────────────────────────────
export const contactEntries = pgTable(
  "contact_entries",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    preferredDate: timestamp("preferred_date", { withTimezone: true }).notNull(),
    preferredTime: text("preferred_time").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("contact_entries_created_at_idx").on(table.createdAt),
    isReadIdx: index("contact_entries_is_read_idx").on(table.isRead),
  }),
);

export const insertContactEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  message: z.string().min(1).max(5000),
  preferredDate: z.coerce.date(),
  preferredTime: z.string().min(1),
  isRead: z.coerce.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export type ContactEntry = typeof contactEntries.$inferSelect;
export type NewContactEntry = typeof contactEntries.$inferInsert;

// ─── Site Settings ───────────────────────────────────────────────────────────
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  type: text("type", { enum: ["text", "number", "boolean", "json"] })
    .notNull()
    .default("text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings);
export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

// ─── Site Info (single-row table for editable website information) ────────────
export const siteInfo = pgTable(
  "site_info",
  {
    id: text("id").primaryKey(),
    businessName: text("business_name").notNull().default("Swayam Goyal & Associates"),
    tagline: text("tagline").notNull().default(""),
    ownerName: text("owner_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    whatsapp: text("whatsapp").notNull().default(""),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    aboutText: text("about_text").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    instagram: text("instagram").notNull().default(""),
    facebook: text("facebook").notNull().default(""),
    linkedin: text("linkedin").notNull().default(""),
    youtube: text("youtube").notNull().default(""),
    businessHours: text("business_hours").notNull().default(""),
    heroHeading: text("hero_heading").notNull().default(""),
    heroSubtext: text("hero_subtext").notNull().default(""),
    heroDescription: text("hero_description").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const insertSiteInfoSchema = createInsertSchema(siteInfo);
export type SiteInfoRow = typeof siteInfo.$inferSelect;
export type NewSiteInfoRow = typeof siteInfo.$inferInsert;
