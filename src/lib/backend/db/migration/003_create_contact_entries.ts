import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const contactEntriesMigration = sqliteTable("contact_entries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  preferredDate: integer("preferred_date", { mode: "timestamp" }).notNull(),
  preferredTime: text("preferred_time").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
