import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MessageCircle,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import consultHero from "@/assets/consultation-room.jpg";
import consultImage from "@/assets/audit-ledger.jpg";
import { Button } from "@/components/ui/button";
import { HeroBanner, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { listFormats, submitConsultation } from "@/lib/backend/consultations";
import { getPublicSettings } from "@/lib/backend/settings";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Consultation | Swayam Goyal & Associates" },
      {
        name: "description",
        content: "Choose a consultation format, date, and time with Swayam Goyal & Associates.",
      },
      { property: "og:title", content: "Book a Consultation | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content:
          "Phone Call, Face-to-Face, or Video Conference consultations, available daily except Sunday.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationPage,
});

type Format = {
  id: string;
  name: string;
  shortName: string;
  duration: string;
  fee: number;
  note: string;
};
type PublicTestimonial = { id: string; quote: string; name: string; place: string };
type PublicSettings = Record<string, { value: string; type: string }>;

const DEFAULT_TIMES = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
const DEFAULT_WA_NUMBER = "919617072100";

function ConsultationPage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [phoneForWa, setPhoneForWa] = useState(DEFAULT_WA_NUMBER);
  const [format, setFormat] = useState<Format | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => nextAvailableDate(new Date()));
  const [selectedTime, setSelectedTime] = useState<string>(DEFAULT_TIMES[0]!);
  const [step, setStep] = useState<"select" | "payment" | "confirmed">("select");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [isActive, setIsActive] = useState(true);
  const dates = useMemo(() => getAvailableDates(), []);

  useEffect(() => {
    listFormats()
      .then((res) => res.json())
      .then((data: Format[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setFormats(data);
          setFormat(data[0] ?? null);
        }
      })
      .catch(() => {});

    getPublicSettings()
      .then((res) => res.json())
      .then((s: PublicSettings) => {
        const t = s["consultation_times"]?.value;
        if (t) {
          try {
            const parsed = JSON.parse(t);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTimes(parsed);
              setSelectedTime(parsed[0] ?? DEFAULT_TIMES[0]!);
            }
          } catch {
            // ignore
          }
        }
        const phone = s["whatsapp_number"]?.value;
        if (phone) setPhoneForWa(phone);
      })
      .catch(() => {});

    import("@/lib/backend/testimonials")
      .then(({ getPublicTestimonials }) =>
        getPublicTestimonials()
          .then((res) => res.json())
          .then((data: PublicTestimonial[]) => setTestimonials(Array.isArray(data) ? data : [])),
      )
      .catch(() => {});

    import("@/lib/backend/siteInfo")
      .then(({ getPublicSiteInfo }) =>
        getPublicSiteInfo()
          .then((res) => res.json())
          .then((data) => {
            if (data) setIsActive(data.isActive ?? true);
          }),
      )
      .catch(() => {});
  }, []);

  const waUrl = format
    ? `https://wa.me/${phoneForWa}?text=${encodeURIComponent(`Hi, I'd like to book a ${format.shortName} consultation on ${formatDate(selectedDate)} at ${selectedTime}.`)}`
    : `https://wa.me/${phoneForWa}`;

  const continueToPayment = async () => {
    if (!format) return;
    if (!name.trim() || !contact.trim()) {
      setError("Please add your name and phone or email before continuing.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await submitConsultation({
        data: {
          body: {
            name,
            contact,
            formatId: format.id,
            date: selectedDate.toISOString(),
            time: selectedTime,
          },
        },
      });
      if (res.ok) {
        setStep("payment");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not save your booking. Please try again.",
        );
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!format) {
    return (
      <main>
        <section className="relative flex min-h-[560px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:px-10 sm:pb-20 lg:px-16">
          <HeroBanner
            src={consultHero}
            alt="Quiet consultation room with two armchairs and a small round table"
          />
          <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
            <SectionKicker>Book a consultation</SectionKicker>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] sm:text-7xl">
              Choose a format and a time.
            </h1>
          </Reveal>
        </section>
        <section className="bg-muted/45 px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
            Loading formats…
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner
          src={consultHero}
          alt="Quiet consultation room with two armchairs and a small round table"
        />
        <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
          <SectionKicker>Book a consultation</SectionKicker>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] sm:text-7xl">
            Choose a format and a time.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-secondary-foreground/75">
            Speak directly with a Chartered Accountant on GST, Income Tax, Audit, Industrial
            Subsidy, or Finance matters. Choose a format and time that works for you.
          </p>
          <div className="mt-5">
            <AvailabilityBadge isActive={isActive} />
          </div>
        </Reveal>
      </section>

      <section className="bg-muted/45 px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <Reveal>
                <div className="image-frame mb-12 aspect-[16/7]">
                  <img
                    src={consultImage}
                    alt="Leather-bound ledger, audit papers and brass pen"
                    width={1200}
                    height={800}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </div>
              </Reveal>
              <Reveal>
                <SectionKicker>Booking flow</SectionKicker>
                <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                  Schedule your conversation.
                </h2>
              </Reveal>
              <div className="mt-10 rounded-2xl border border-border bg-card p-5 editorial-shadow sm:p-8">
                <StepIndicator step={step} />
                {step === "select" && (
                  <SelectionStep
                    format={format}
                    setFormat={setFormat}
                    formats={formats}
                    dates={dates}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    times={times}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    name={name}
                    setName={setName}
                    contact={contact}
                    setContact={setContact}
                    error={error}
                    submitting={submitting}
                    onContinue={continueToPayment}
                    waUrl={waUrl}
                  />
                )}
                {step === "payment" && (
                  <PaymentStep
                    format={format}
                    date={selectedDate}
                    time={selectedTime}
                    onBack={() => setStep("select")}
                    onContinue={() => setStep("confirmed")}
                  />
                )}
                {step === "confirmed" && (
                  <ConfirmedStep
                    name={name}
                    format={format}
                    date={selectedDate}
                    time={selectedTime}
                    onRestart={() => setStep("select")}
                  />
                )}
              </div>
            </div>
            <aside className="lg:sticky lg:top-28">
              <Summary format={format} date={selectedDate} time={selectedTime} />
            </aside>
          </div>
          <BelowBooking />
          <Testimonials testimonials={testimonials} />
        </div>
      </section>
    </main>
  );
}

function SelectionStep({
  format,
  setFormat,
  formats,
  dates,
  selectedDate,
  setSelectedDate,
  times,
  selectedTime,
  setSelectedTime,
  name,
  setName,
  contact,
  setContact,
  error,
  submitting,
  onContinue,
  waUrl,
}: {
  format: Format;
  setFormat: (value: Format) => void;
  formats: Format[];
  dates: Date[];
  selectedDate: Date;
  setSelectedDate: (value: Date) => void;
  times: string[];
  selectedTime: string;
  setSelectedTime: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  contact: string;
  setContact: (value: string) => void;
  error: string;
  submitting: boolean;
  onContinue: () => void;
  waUrl: string;
}) {
  return (
    <div className="mt-10 space-y-10">
      <FieldGroup label="01 / Format">
        <div className="grid gap-3 md:grid-cols-3">
          {formats.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => setFormat(item)}
              className={`rounded-xl border p-4 text-left transition-all ${
                format.name === item.name
                  ? "border-primary bg-accent editorial-shadow"
                  : "border-border bg-background hover:border-primary/45"
              }`}
            >
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{item.duration}</span>
              <span className="mt-4 block font-display text-2xl text-primary">
                ₹{item.fee.toLocaleString("en-IN")}
              </span>
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="02 / Date">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {dates.map((date) => (
            <button
              type="button"
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`rounded-xl border p-4 text-left transition-all ${
                sameDay(date, selectedDate)
                  ? "border-primary bg-accent editorial-shadow"
                  : "border-border bg-background hover:border-primary/45"
              }`}
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {date.toLocaleDateString("en-IN", { weekday: "short" })}
              </span>
              <span className="mt-2 block font-display text-2xl">{date.getDate()}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {date.toLocaleDateString("en-IN", { month: "short" })}
              </span>
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="03 / Time">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {times.map((time) => (
            <button
              type="button"
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`rounded-xl border px-3 py-3 text-sm transition-all ${
                selectedTime === time
                  ? "border-primary bg-primary text-primary-foreground editorial-shadow"
                  : "border-border bg-background hover:border-primary/45"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Available daily, except Sunday.</p>
      </FieldGroup>

      <FieldGroup label="04 / Your details">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            aria-label="Name"
            className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
          />
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Phone or email"
            aria-label="Phone or email"
            className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </FieldGroup>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={onContinue}
          disabled={submitting}
          className="magnetic-button h-auto rounded-xl bg-primary px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
        >
          {submitting ? "Submitting…" : "Continue to payment"} <ArrowRight />
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-auto rounded-xl px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-foreground hover:bg-accent"
        >
          <a href={waUrl} target="_blank" rel="noreferrer">
            <MessageCircle /> Prefer WhatsApp?
          </a>
        </Button>
      </div>
    </div>
  );
}

function PaymentStep({
  format,
  date,
  time,
  onBack,
  onContinue,
}: {
  format: Format;
  date: Date;
  time: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-10 space-y-7">
      <div className="rounded-2xl border border-primary/35 bg-accent p-5">
        <div className="flex gap-3">
          <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-semibold">Payment step placeholder</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Razorpay / PayU integration will be added here in a future release. No payment is
              processed by this website.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-3">
        <div>
          <span className="block text-xs text-muted-foreground">Format</span>
          <span className="mt-1 block font-medium">{format.name}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Date & time</span>
          <span className="mt-1 block font-medium">
            {formatDate(date)} · {time}
          </span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Fee shown</span>
          <span className="mt-1 block font-medium text-primary">
            ₹{format.fee.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-auto rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground hover:bg-accent"
        >
          <ArrowLeft /> Back to selection
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          className="magnetic-button h-auto rounded-xl bg-secondary px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-secondary-foreground hover:bg-secondary"
        >
          Preview confirmation <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function ConfirmedStep({
  name,
  format,
  date,
  time,
  onRestart,
}: {
  name: string;
  format: Format;
  date: Date;
  time: string;
  onRestart: () => void;
}) {
  return (
    <div className="mt-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-primary">
        <Check className="size-7" />
      </div>
      <h3 className="mt-6 font-display text-3xl">Confirmation preview</h3>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
        {name}, your {format.name} consultation request is staged for {formatDate(date)} at {time}.
        No payment has been processed.
      </p>
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-muted p-5 text-left text-sm">
        <p>
          <span className="text-muted-foreground">Format:</span> {format.name}
        </p>
        <p className="mt-2">
          <span className="text-muted-foreground">Fee:</span> ₹{format.fee.toLocaleString("en-IN")}
        </p>
        <p className="mt-2">
          <span className="text-muted-foreground">Next step:</span> Payment integration to be
          connected
        </p>
      </div>
      <Button
        type="button"
        onClick={onRestart}
        variant="outline"
        className="mt-8 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground hover:bg-accent"
      >
        Edit selection
      </Button>
    </div>
  );
}

function Summary({ format, date, time }: { format: Format; date: Date; time: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground editorial-shadow sm:p-7">
      <SectionKicker>Booking summary</SectionKicker>
      <div className="mt-7 space-y-4 text-sm">
        <SummaryRow icon={<CalendarDays />} label="Format" value={format.name} />
        <SummaryRow icon={<Clock3 />} label="Date & time" value={`${formatDate(date)} · ${time}`} />
      </div>
      <div className="mt-8 flex items-end justify-between border-t border-secondary-foreground/15 pt-5">
        <span className="text-sm text-secondary-foreground/60">Professional fee</span>
        <span className="font-display text-3xl text-primary">
          ₹{format.fee.toLocaleString("en-IN")}
        </span>
      </div>
      <p className="mt-5 text-xs leading-6 text-secondary-foreground/55">
        Payment is a future integration placeholder. Slot selection here is for preview.
      </p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-primary">{icon}</span>
      <div>
        <span className="block text-xs text-secondary-foreground/55">{label}</span>
        <span className="mt-1 block font-medium">{value}</span>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
        {label}
      </label>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StepIndicator({ step }: { step: "select" | "payment" | "confirmed" }) {
  const labels = ["Select", "Payment", "Confirmation"];
  const index = step === "select" ? 0 : step === "payment" ? 1 : 2;
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border pb-6">
      {labels.map((label, itemIndex) => (
        <div
          key={label}
          className={`flex items-center gap-2 text-xs ${itemIndex <= index ? "text-primary" : "text-muted-foreground"}`}
        >
          <span
            className={`grid size-6 place-items-center rounded-full border text-[10px] ${itemIndex <= index ? "border-primary bg-accent" : "border-border"}`}
          >
            {itemIndex < index ? <Check className="size-3" /> : itemIndex + 1}
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function BelowBooking() {
  return (
    <div className="mt-24 grid gap-12 border-t border-border pt-16 lg:grid-cols-3">
      <Reveal>
        <SectionKicker>How booking works</SectionKicker>
        <div className="mt-5 grid gap-4">
          {["Choose a format and pick a slot", "Confirm with payment", "Get confirmation"].map(
            (item, index) => (
              <div key={item} className="flex gap-4">
                <span className="font-mono text-xs text-primary">0{index + 1}</span>
                <span className="text-sm text-foreground/75">{item}</span>
              </div>
            ),
          )}
        </div>
      </Reveal>
      <Reveal className="delay-1">
        <SectionKicker>Document checklist</SectionKicker>
        <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
          {[
            "PAN / Aadhaar",
            "GSTIN and recent returns",
            "Relevant notice/letter",
            "Financial statements or bank correspondence",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Check className="size-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal className="delay-2">
        <SectionKicker>Confidentiality</SectionKicker>
        <div className="mt-5 flex gap-3 text-sm leading-7 text-muted-foreground">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" />
          <p>
            All information shared during a consultation is kept strictly confidential, in line with
            our professional obligations.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div className="mt-24 border-t border-border pt-16">
      <Reveal>
        <SectionKicker>Client experience</SectionKicker>
        <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
          What clients say about working with the firm.
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <Reveal key={item.id} className={`delay-${Math.min(index + 1, 4)}`}>
            <figure className="h-full rounded-2xl border border-border bg-card p-6 editorial-shadow transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_26px_80px_color-mix(in_oklab,var(--primary)_14%,transparent)]">
              <Quote className="size-5 text-primary" />
              <blockquote className="mt-4 text-sm leading-7 text-foreground/80">
                {item.quote}
              </blockquote>
              <figcaption className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {item.name} · {item.place}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function nextAvailableDate(from: Date) {
  const date = new Date(from);
  while (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date;
}

function getAvailableDates() {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (dates.length < 4) {
    if (cursor.getDay() !== 0) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
