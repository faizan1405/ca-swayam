/** Idempotent PostgreSQL seed. Run `npm run db:migrate` first. */
import bcrypt from "bcryptjs";
import { db, admins, services, testimonials, consultationFormats, siteInfo, siteSettings } from "./db";

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"];
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"];
const ADMIN_NAME = process.env["ADMIN_NAME"];
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set before seeding");
}

const now = new Date();
const seedServices = [
  { id: "svc_subsidy", number: "01", title: "Industrial Subsidy", label: "Industrial Subsidy", description: "State and central industrial subsidy assistance, including capital investment subsidy, interest subsidy, and stamp duty / registration reimbursement for eligible units in Chhattisgarh.", items: ["Capital Investment Subsidy", "Interest Subsidy", "Stamp Duty Reimbursement", "CG / State Schemes"], sortOrder: 1 },
  { id: "svc_audit", number: "02", title: "Audit", label: "Audit", description: "Statutory audit, tax audit, bank audit (concurrent / revenue / stock audit), and certification assignments for companies, LLPs, partnerships, and proprietorship concerns.", items: ["Statutory Audit", "Tax Audit", "Bank Audit", "Certifications"], sortOrder: 2 },
  { id: "svc_gst", number: "03", title: "GST", label: "Goods & Services Tax", description: "End-to-end GST compliance, return filing, advisory, departmental notice handling, and litigation support before the Appellate and Tribunal authorities.", items: ["Monthly / Quarterly Returns", "Annual Return", "Notice Reply", "Litigation Support"], sortOrder: 3 },
  { id: "svc_income_tax", number: "04", title: "Income Tax", label: "Income Tax", description: "Income tax return filing for individuals, firms, and corporates, TDS / TCS compliance, advance tax planning, and representation before the assessing and appellate authorities.", items: ["ITR Filing", "TDS / TCS", "Tax Planning", "Assessment & Appeals"], sortOrder: 4 },
  { id: "svc_accounting", number: "05", title: "Accounting & Book Keeping", label: "Accounting & Book Keeping", description: "Day-to-day bookkeeping, monthly financial statements, bank reconciliation, payroll, and management information systems, structured to suit the scale of your business.", items: ["Monthly Books", "Financial Statements", "Bank Reconciliation", "Payroll"], sortOrder: 5 },
  { id: "svc_tendering", number: "06", title: "Tendering", label: "Tendering", description: "Tender documentation support, EMD / SD processing, pre- and post-bid financial advisory, and contract review for government and PSU assignments.", items: ["EMD / SD", "Tender Filing", "Bid Advisory", "Contract Review"], sortOrder: 6 },
  { id: "svc_msme", number: "07", title: "MSME Advisory", label: "MSME Advisory", description: "Udyam registration, project profiles for bank finance, working capital and term loan assistance, and ongoing advisory for micro, small, and medium enterprises.", items: ["Udyam Registration", "Project Profiles", "Bank Finance", "Compliance"], sortOrder: 7 },
];
const seedTestimonials = [
  { id: "tst_1", quote: "The team handled our industrial subsidy application end-to-end. Clear timelines, no surprises, and the disbursement came through faster than we expected.", name: "Director", place: "Manufacturing Unit, Surajpur", sortOrder: 1 },
  { id: "tst_2", quote: "We have worked with Swayam Goyal & Associates for over three years on GST and tax matters. Practical, responsive, and reliable throughout.", name: "Partner", place: "Trading Business, Raipur", sortOrder: 2 },
  { id: "tst_3", quote: "Bank audit and project-profile support from the firm has been professional and accurate. They understand the operational realities of a contracting firm.", name: "Managing Director", place: "Contracting Firm, Ambikapur", sortOrder: 3 },
];
const seedFormats = [
  { id: "fmt_phone", name: "20-min Phone Call", shortName: "Phone", duration: "20 min", fee: 500, note: "Direct phone call", sortOrder: 1 },
  { id: "fmt_video", name: "45-min Video Call", shortName: "Video", duration: "45 min", fee: 1000, note: "Online video meeting", sortOrder: 2 },
  { id: "fmt_subsidy", name: "Subsidy Roadmap Session (60 min)", shortName: "Subsidy Roadmap", duration: "60 min", fee: 5000, note: "In-depth subsidy roadmap", sortOrder: 3 },
];
const seedSettings = [
  ["firm_name", "Swayam Goyal & Associates", "text"], ["firm_tagline", "Chartered Accountants", "text"],
  ["phone_number", "9617072100", "text"], ["whatsapp_number", "919617072100", "text"],
  ["email", "swayamsoffice@gmail.com", "text"], ["address_surajpur", "1st Floor, Goyal Bhawan, In Front of SBI, Main Road, Surajpur 497229", "text"],
  ["address_raipur", "Full address pending confirmation.", "text"], ["icai_membership", "437708", "text"],
  ["frn", "024178C", "text"], ["established_year", "2017", "text"], ["team_size", "10", "text"],
  ["hero_title", "Chartered Accountants for Growing Businesses in Chhattisgarh", "text"],
  ["hero_subtitle", "Industrial subsidy, GST, income tax, audit, and bank finance - since 2017, from Surajpur.", "text"],
  ["consultation_times", JSON.stringify(["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]), "json"],
  ["whatsapp_message", "Hi, I'd like to speak with Swayam Goyal & Associates about a consultation.", "text"],
  ["show_testimonials_note", "true", "boolean"],
] as const;

await db.insert(admins).values({ id: "admin_main", email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), name: ADMIN_NAME, createdAt: now }).onConflictDoNothing({ target: admins.email });
await db.insert(services).values(seedServices.map((row) => ({ ...row, isActive: true, createdAt: now, updatedAt: now }))).onConflictDoNothing({ target: services.id });
await db.insert(testimonials).values(seedTestimonials.map((row) => ({ ...row, isActive: true, createdAt: now, updatedAt: now }))).onConflictDoNothing({ target: testimonials.id });
await db.insert(consultationFormats).values(seedFormats.map((row) => ({ ...row, isActive: true }))).onConflictDoNothing({ target: consultationFormats.id });
await db.insert(siteInfo).values({ id: "site", businessName: "Swayam Goyal & Associates", tagline: "Chartered Accountants", phone: "9617072100", whatsapp: "919617072100", email: "swayamsoffice@gmail.com", address: "1st Floor, Goyal Bhawan, Surajpur", heroHeading: "Chartered Accountants for Growing Businesses in Chhattisgarh", heroSubtext: "Industrial subsidy, GST, income tax, audit, and bank finance - since 2017, from Surajpur.", isActive: true, createdAt: now, updatedAt: now }).onConflictDoNothing({ target: siteInfo.id });
for (const [key, value, type] of seedSettings) {
  await db.insert(siteSettings).values({ key, value, type, updatedAt: now }).onConflictDoNothing({ target: siteSettings.key });
}
console.log("PostgreSQL seed complete.");
process.exit(0);
