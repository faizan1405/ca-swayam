/**
 * Seed script for Swayam Goyal & Associates database.
 * Run with: node --env-file=.env node_modules/tsx/dist/cli.cjs src/lib/backend/db-seed.ts
 */
import Database from "better-sqlite3";
import { hashPassword } from "./auth";
import {
  SESSION_SECRET,
  DATABASE_PATH,
  NODE_ENV,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
} from "./env";

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    title TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    items TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    quote TEXT NOT NULL,
    name TEXT NOT NULL,
    place TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS consultation_formats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    duration TEXT NOT NULL,
    fee INTEGER NOT NULL,
    note TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    format_id TEXT NOT NULL,
    date INTEGER NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS site_info (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL DEFAULT 'Swayam Goyal & Associates',
    tagline TEXT NOT NULL DEFAULT '',
    owner_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    about_text TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    facebook TEXT NOT NULL DEFAULT '',
    linkedin TEXT NOT NULL DEFAULT '',
    youtube TEXT NOT NULL DEFAULT '',
    business_hours TEXT NOT NULL DEFAULT '',
    hero_heading TEXT NOT NULL DEFAULT '',
    hero_subtext TEXT NOT NULL DEFAULT '',
    hero_description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contact_entries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    preferred_date INTEGER NOT NULL,
    preferred_time TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    updated_at INTEGER NOT NULL
  );
`);

console.log("Seeding database...");

const now = Date.now();

// Admin
const adminRow = sqlite.prepare("SELECT id FROM admins WHERE email = ?").get(ADMIN_EMAIL);
if (!adminRow) {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  sqlite.prepare("INSERT INTO admins (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(["admin_main", ADMIN_EMAIL, passwordHash, ADMIN_NAME, now]);
  console.log(`Admin created: ${ADMIN_EMAIL}`);
} else {
  console.log("Admin already exists, skipping.");
}

// Services
const svcInsert = sqlite.prepare(
  "INSERT OR IGNORE INTO services (id, number, title, label, description, items, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
const SEED_SERVICES = [
  { id: "svc_subsidy", number: "01", title: "Industrial Subsidy", label: "Industrial Subsidy", description: "State and central industrial subsidy assistance, including capital investment subsidy, interest subsidy, and stamp duty / registration reimbursement for eligible units in Chhattisgarh.", items: ["Capital Investment Subsidy", "Interest Subsidy", "Stamp Duty Reimbursement", "CG / State Schemes"], sortOrder: 1 },
  { id: "svc_audit", number: "02", title: "Audit", label: "Audit", description: "Statutory audit, tax audit, bank audit (concurrent / revenue / stock audit), and certification assignments for companies, LLPs, partnerships, and proprietorship concerns.", items: ["Statutory Audit", "Tax Audit", "Bank Audit", "Certifications"], sortOrder: 2 },
  { id: "svc_gst", number: "03", title: "GST", label: "Goods & Services Tax", description: "End-to-end GST compliance, return filing, advisory, departmental notice handling, and litigation support before the Appellate and Tribunal authorities.", items: ["Monthly / Quarterly Returns", "Annual Return", "Notice Reply", "Litigation Support"], sortOrder: 3 },
  { id: "svc_income_tax", number: "04", title: "Income Tax", label: "Income Tax", description: "Income tax return filing for individuals, firms, and corporates, TDS / TCS compliance, advance tax planning, and representation before the assessing and appellate authorities.", items: ["ITR Filing", "TDS / TCS", "Tax Planning", "Assessment & Appeals"], sortOrder: 4 },
  { id: "svc_accounting", number: "05", title: "Accounting & Book Keeping", label: "Accounting & Book Keeping", description: "Day-to-day bookkeeping, monthly financial statements, bank reconciliation, payroll, and management information systems, structured to suit the scale of your business.", items: ["Monthly Books", "Financial Statements", "Bank Reconciliation", "Payroll"], sortOrder: 5 },
  { id: "svc_tendering", number: "06", title: "Tendering", label: "Tendering", description: "Tender documentation support, EMD / SD processing, pre- and post-bid financial advisory, and contract review for government and PSU assignments.", items: ["EMD / SD", "Tender Filing", "Bid Advisory", "Contract Review"], sortOrder: 6 },
  { id: "svc_msme", number: "07", title: "MSME Advisory", label: "MSME Advisory", description: "Udyam registration, project profiles for bank finance, working capital and term loan assistance, and ongoing advisory for micro, small, and medium enterprises.", items: ["Udyam Registration", "Project Profiles", "Bank Finance", "Compliance"], sortOrder: 7 },
];
let svcCount = 0;
for (const svc of SEED_SERVICES) {
  const r = svcInsert.run([svc.id, svc.number, svc.title, svc.label, svc.description, JSON.stringify(svc.items), svc.sortOrder, 1, now, now]);
  if (r.changes > 0) svcCount++;
}
console.log(`Services seeded (${svcCount} new, ${SEED_SERVICES.length - svcCount} existing)`);

// Testimonials
const tstInsert = sqlite.prepare(
  "INSERT OR IGNORE INTO testimonials (id, quote, name, place, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
const SEED_TESTIMONIALS = [
  { id: "tst_1", quote: "The team handled our industrial subsidy application end-to-end. Clear timelines, no surprises, and the disbursement came through faster than we expected.", name: "Director", place: "Manufacturing Unit, Surajpur", sortOrder: 1 },
  { id: "tst_2", quote: "We have worked with Swayam Goyal & Associates for over three years on GST and tax matters. Practical, responsive, and reliable throughout.", name: "Partner", place: "Trading Business, Raipur", sortOrder: 2 },
  { id: "tst_3", quote: "Bank audit and project-profile support from the firm has been professional and accurate. They understand the operational realities of a contracting firm.", name: "Managing Director", place: "Contracting Firm, Ambikapur", sortOrder: 3 },
];
let tstCount = 0;
for (const t of SEED_TESTIMONIALS) {
  const r = tstInsert.run([t.id, t.quote, t.name, t.place, t.sortOrder, 1, now, now]);
  if (r.changes > 0) tstCount++;
}
console.log(`Testimonials seeded (${tstCount} new, ${SEED_TESTIMONIALS.length - tstCount} existing)`);

// Consultation Formats
const fmtInsert = sqlite.prepare(
  "INSERT OR IGNORE INTO consultation_formats (id, name, short_name, duration, fee, note, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
const SEED_FORMATS = [
  { id: "fmt_phone", name: "Phone Call", shortName: "Phone", duration: "10-20 min", fee: 500, note: "Direct phone call", sortOrder: 1 },
  { id: "fmt_face", name: "Face-to-Face (office)", shortName: "Face-to-Face", duration: "10-20 min", fee: 1000, note: "At the office", sortOrder: 2 },
  { id: "fmt_video", name: "Video Conference", shortName: "Video", duration: "10-20 min", fee: 1000, note: "Online meeting", sortOrder: 3 },
];
let fmtCount = 0;
for (const f of SEED_FORMATS) {
  const r = fmtInsert.run([f.id, f.name, f.shortName, f.duration, f.fee, f.note, f.sortOrder, 1]);
  if (r.changes > 0) fmtCount++;
}
console.log(`Consultation formats seeded (${fmtCount} new, ${SEED_FORMATS.length - fmtCount} existing)`);

// Site Settings
const setInsert = sqlite.prepare(
  "INSERT OR IGNORE INTO site_settings (key, value, type, updated_at) VALUES (?, ?, ?, ?)"
);
const setUpdate = sqlite.prepare(
  "UPDATE site_settings SET value = ?, type = ?, updated_at = ? WHERE key = ?"
);
const SEED_SETTINGS = [
  ["firm_name", "Swayam Goyal & Associates", "text"],
  ["firm_tagline", "Chartered Accountants", "text"],
  ["phone_number", "9617072100", "text"],
  ["whatsapp_number", "919617072100", "text"],
  ["email", "swayamsoffice@gmail.com", "text"],
  ["address_surajpur", "1st Floor, Goyal Bhawan, In Front of SBI, Main Road, Surajpur 497229", "text"],
  ["address_raipur", "Full address pending confirmation.", "text"],
  ["icai_membership", "437708", "text"],
  ["frn", "024178C", "text"],
  ["established_year", "2017", "text"],
  ["team_size", "10", "text"],
  ["hero_title", "Chartered Accountants for Growing Businesses in Chhattisgarh", "text"],
  ["hero_subtitle", "Industrial subsidy, GST, income tax, audit, and bank finance - since 2017, from Surajpur.", "text"],
  ["consultation_times", JSON.stringify(["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]), "json"],
  ["whatsapp_message", "Hi, I'd like to speak with Swayam Goyal & Associates about a consultation.", "text"],
  ["show_testimonials_note", "true", "boolean"],
];
let setCount = 0;
for (const s of SEED_SETTINGS) {
  const existing = sqlite.prepare("SELECT key FROM site_settings WHERE key = ?").get(s[0]);
  if (!existing) {
    setInsert.run([s[0], s[1], s[2], now]);
    setCount++;
  } else {
    setUpdate.run([s[1], s[2], now, s[0]]);
  }
}
console.log(`Site settings seeded (${setCount} new, ${SEED_SETTINGS.length - setCount} existing)`);

console.log("Seed complete.");

sqlite.close();
