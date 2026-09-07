import { text, integer } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

export const siteInfo = sqliteTable("site_info", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
