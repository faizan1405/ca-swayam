import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, ClockIcon, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import contactHero from "@/assets/office-reception.jpg";
import contactImage from "@/assets/consultation-room.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { HeroBanner, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { getPublicSettings } from "@/lib/backend/settings";
import { submitContactEntry } from "@/lib/backend/services";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Swayam Goyal & Associates" },
      {
        name: "description",
        content:
          "Contact Swayam Goyal & Associates in Surajpur or reach the firm by phone, email, or WhatsApp.",
      },
      { property: "og:title", content: "Contact | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content: "Find the Surajpur office, contact details, and the Raipur office information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

type PublicSettings = Record<string, { value: string; type: string }>;

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM",
];

function ContactPage() {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [preferredTime, setPreferredTime] = useState("");

  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    getPublicSettings()
      .then((res) => res.json())
      .then((data: PublicSettings) => setSettings(data ?? {}))
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

  const phoneSetting = settings["phone_number"]?.value ?? "9617072100";
  const emailSetting = settings["email"]?.value ?? "swayamsoffice@gmail.com";
  const waNumber = settings["whatsapp_number"]?.value ?? "919617072100";
  const addressSurajpur = settings["address_surajpur"]?.value ?? "";
  const addressRaipur = settings["address_raipur"]?.value ?? "";

  const formattedPhone = phoneSetting.length === 10 ? `+91 ${phoneSetting.slice(0, 5)} ${phoneSetting.slice(5)}` : phoneSetting;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Please enter a valid email address";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (phone.trim().length < 10)
      newErrors.phone = "Please enter a valid phone number";
    if (!message.trim()) newErrors.message = "Message is required";
    if (!preferredDate) newErrors.date = "Preferred date is required";
    if (!preferredTime) newErrors.time = "Preferred time is required";
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
      const res = await submitContactEntry(
        new Request(window.location.href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim(),
            preferredDate: preferredDate!.toISOString(),
            preferredTime,
          }),
        }),
      );

      if (res.ok) {
        toast.success("Your enquiry has been submitted! We will get back to you soon.");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setPreferredDate(undefined);
        setPreferredTime("");
        setErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Could not submit your enquiry. Please try again.");
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <main>
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner src={contactHero} alt="Modern office reception with deep teal wall and warm light" />
        <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
          <SectionKicker>Contact</SectionKicker>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] sm:text-7xl">
            Let's connect.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-secondary-foreground/75">
            Send us your enquiry or book a callback at your preferred date and time.
          </p>
          <div className="mt-5">
            <AvailabilityBadge isActive={isActive} />
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-[1fr_0.9fr]">
          {/* Contact Form */}
          <Reveal>
            <SectionKicker>Send an enquiry</SectionKicker>
            <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight sm:text-6xl">
              Fill in your details.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              We will respond to your enquiry promptly. Select your preferred date and time for a callback.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
              {/* Name */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Name <span className="text-destructive">*</span>
                </label>
                <div className="mt-2 relative">
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: "" })); }}
                    placeholder="Your full name"
                    aria-label="Name"
                    aria-invalid={!!errors.name}
                    className={errors.name ? "border-destructive" : ""}
                  />
                </div>
                {errors.name && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: "" })); }}
                    placeholder="your@email.com"
                    aria-label="Email"
                    aria-invalid={!!errors.email}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Phone <span className="text-destructive">*</span>
                </label>
                <div className="mt-2 relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: "" })); }}
                    placeholder="+91 96170 72100"
                    aria-label="Phone number"
                    aria-invalid={!!errors.phone}
                    className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.phone && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Message <span className="text-destructive">*</span>
                </label>
                <div className="mt-2 relative">
                  <MessageCircle className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors(prev => ({ ...prev, message: "" })); }}
                    placeholder="Tell us how we can help..."
                    rows={4}
                    aria-label="Message"
                    aria-invalid={!!errors.message}
                    className={`pl-10 min-h-[100px] ${errors.message ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.message && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.message}</p>}
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
                        className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-background px-4 text-left text-sm transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-ring ${
                          errors.date ? "border-destructive" : "border-input"
                        }`}
                      >
                        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                        {preferredDate ? (
                          <span className="flex-1">
                            {preferredDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
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
                        selected={preferredDate}
                        onSelect={(date) => {
                          setPreferredDate(date);
                          setDateOpen(false);
                          if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                        }}
                        disabled={{ before: today }}
                        captionLayout="label"
                        classNames={{
                          caption_label: "text-sm font-medium select-none",
                        }}
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
                    value={preferredTime}
                    onValueChange={(val) => {
                      setPreferredTime(val);
                      if (errors.time) setErrors(prev => ({ ...prev, time: "" }));
                    }}
                  >
                    <SelectTrigger
                      aria-invalid={!!errors.time}
                      className={errors.time ? "border-destructive" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder="Select a time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot} className="text-center text-xs">
                            {slot}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                {errors.time && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.time}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="magnetic-button h-auto w-full rounded-xl bg-primary px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
              >
                {submitting ? "Submitting…" : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="size-4" />
                    Send Enquiry
                  </span>
                )}
              </Button>
            </form>
          </Reveal>

          {/* Sidebar - Office Info */}
          <Reveal className="delay-2">
            <div className="space-y-8">
              <div className="rounded-2xl border border-border bg-card p-6 editorial-shadow">
                <SectionKicker>Office &amp; direct contact</SectionKicker>
                <div className="mt-6 grid gap-6">
                  <Office title="Surajpur Office">
                    <address className="not-italic text-sm leading-7 text-muted-foreground">
                      {addressSurajpur || "Address loading..."}
                    </address>
                  </Office>
                  {addressRaipur && addressRaipur !== "Full address pending confirmation." && (
                    <Office title="Raipur Office">
                      <p className="text-sm leading-7 text-muted-foreground">
                        {addressRaipur}
                      </p>
                    </Office>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="magnetic-button rounded-xl bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-secondary-foreground hover:bg-secondary"
                  >
                    <a href={`tel:${phoneSetting}`}>
                      <Phone className="size-4" /> {formattedPhone}
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground hover:bg-accent"
                  >
                    <a href={`mailto:${emailSetting}`}>
                      <Mail className="size-4" /> Email
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl bg-whatsapp px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-secondary hover:bg-whatsapp"
                  >
                    <a
                      href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hi, I'd like to speak with Swayam Goyal & Associates about a consultation.")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <div className="image-frame aspect-[4/5]">
                <img
                  src={contactImage}
                  alt="Private consultation room with two armchairs and a small table"
                  width={1200}
                  height={912}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function Office({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
        <MapPin className="size-4" />
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
