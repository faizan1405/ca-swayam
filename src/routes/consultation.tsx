import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, Clock3, Loader2, MessageSquare, Phone, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Textarea,
} from "@/components/ui/textarea";
import { toast } from "sonner";
import { HeroBanner, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { getPublicSettings } from "@/lib/backend/settings";
import { submitConsultation } from "@/lib/backend/consultations";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Consultation | Swayam Goyal & Associates" },
      {
        name: "description",
        content: "Submit a consultation request to Swayam Goyal & Associates. Choose your preferred date and time.",
      },
      { property: "og:title", content: "Book a Consultation | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content: "Request a consultation with Swayam Goyal & Associates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationPage,
});

type PublicTestimonial = { id: string; quote: string; name: string; place: string };
type PublicSettings = Record<string, { value: string; type: string }>;

const DEFAULT_TIMES = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
const DEFAULT_WA_NUMBER = "919617072100";

type FormErrors = Partial<Record<"name" | "phone" | "date" | "time", string>>;

function ConsultationPage() {
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [phoneForWa, setPhoneForWa] = useState(DEFAULT_WA_NUMBER);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const waMessage = encodeURIComponent(
    "Hi, I'd like to book a consultation with Swayam Goyal & Associates.",
  );
  const waUrl = `https://wa.me/${phoneForWa}?text=${waMessage}`;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.trim().length < 10 || !/^\+?[\d\s()-]+$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!selectedDate) {
      newErrors.date = "Please select a date";
    } else if (selectedDate < today) {
      newErrors.date = "Date cannot be in the past";
    }
    if (!selectedTime) newErrors.time = "Please select a time";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = [
        selectedDate!.getFullYear(),
        String(selectedDate!.getMonth() + 1).padStart(2, "0"),
        String(selectedDate!.getDate()).padStart(2, "0"),
      ].join("-");

      const res = await submitConsultation({
        data: {
          body: {
            name: name.trim(),
            contact: phone.trim(),
            date: dateStr,
            time: selectedTime,
            note: message.trim() || undefined,
          },
        },
      });

      if (res.ok) {
        toast.success("Your consultation request has been submitted successfully!");
        setName("");
        setPhone("");
        setSelectedDate(undefined);
        setSelectedTime(times[0] ?? "");
        setMessage("");
        setErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMsg = typeof data.error === "string" ? data.error : "Could not submit your request. Please try again.";
        toast.error(errorMsg);
        // Don't reset the form on error
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner
          src="/consultation-room.jpg"
          alt="Consultation room"
        />
        <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
          <SectionKicker>Book a consultation</SectionKicker>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] sm:text-7xl">
            Request a consultation.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-secondary-foreground/75">
            Fill in your details and we will confirm your appointment.
          </p>
          <div className="mt-5">
            <AvailabilityBadge isActive={isActive} />
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            {/* Name */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Name <span className="text-destructive">*</span>
              </label>
              <div className="mt-2">
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: "" })); }}
                  placeholder="Your full name"
                  aria-label="Name"
                  aria-invalid={!!errors.name}
                  className={`h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring ${errors.name ? "border-destructive" : "border-input"}`}
                />
              </div>
              {errors.name && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="mt-2 relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" })); }}
                  placeholder="+91 96170 72100"
                  aria-label="Phone number"
                  aria-invalid={!!errors.phone}
                  className={`h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring ${errors.phone ? "border-destructive" : "border-input"}`}
                />
              </div>
              {errors.phone && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
            </div>

            {/* Preferred Date */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Preferred Date <span className="text-destructive">*</span>
              </label>
              <div className="mt-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-expanded={dateOpen}
                      aria-invalid={!!errors.date}
                      className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-background px-4 text-left text-sm transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-ring ${errors.date ? "border-destructive" : "border-input"}`}
                    >
                      <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                      {selectedDate ? (
                        <span className="flex-1">
                          {selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="flex-1 text-muted-foreground">
                          Select a date
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setDateOpen(false);
                        if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                      }}
                      disabled={{ before: today }}
                      captionLayout="label"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {errors.date && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.date}</p>}
            </div>

            {/* Preferred Time */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Preferred Time <span className="text-destructive">*</span>
              </label>
              <div className="mt-2">
                <Select
                  value={selectedTime}
                  onValueChange={(val) => {
                    setSelectedTime(val);
                    if (errors.time) setErrors((prev) => ({ ...prev, time: "" }));
                  }}
                >
                  <SelectTrigger
                    aria-invalid={!!errors.time}
                    className={errors.time ? "border-destructive" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder="Select a time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {times.map((slot) => (
                        <SelectItem key={slot} value={slot} className="text-center text-sm">
                          {slot}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              {errors.time && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.time}</p>}
            </div>

            {/* Message / Note */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Message <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="mt-2 relative">
                <MessageSquare className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                <Textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); }}
                  placeholder="Briefly describe what you'd like to discuss..."
                  rows={3}
                  aria-label="Message"
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="magnetic-button h-auto w-full rounded-xl bg-primary px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="size-4" />
                  Submit Consultation Request
                </span>
              )}
            </Button>
          </form>
        </div>

        <div className="mx-auto mt-24 max-w-7xl border-t border-border pt-16">
          <Testimonials testimonials={testimonials} />
        </div>
      </section>
    </main>
  );
}

function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div>
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
              <MessageSquare className="size-5 text-primary" />
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
