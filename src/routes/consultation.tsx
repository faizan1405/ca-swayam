import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, Clock3, DollarSign, Loader2, Mail, MessageSquare, Phone, Send, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { HeroBanner, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { getPublicSettings } from "@/lib/backend/settings";
import { submitConsultation, listFormats } from "@/lib/backend/consultations";
import { createPaymentOrder } from "@/lib/backend/razorpay/orders";
import { verifyPayment } from "@/lib/backend/razorpay/verify";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Consultation | Swayam Goyal & Associates" },
      {
        name: "description",
        content: "Book a consultation with Swayam Goyal & Associates. Select your preferred type, date, and time.",
      },
      { property: "og:title", content: "Book a Consultation | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content: "Book a consultation with Swayam Goyal & Associates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationPage,
});

type ConsultationFormat = {
  id: string;
  name: string;
  shortName: string;
  duration: string;
  fee: number;
  note: string;
  sortOrder: number;
  isActive: boolean;
};

type PublicTestimonial = { id: string; quote: string; name: string; place: string };
type PublicSettings = Record<string, { value: string; type: string }>;

const DEFAULT_TIMES = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
const DEFAULT_WA_NUMBER = "919617072100";

type FormErrors = Partial<Record<"name" | "phone" | "email" | "type" | "date" | "time", string>>;

function ConsultationPage() {
  const [formats, setFormats] = useState<ConsultationFormat[]>([]);
  const [loadingFormats, setLoadingFormats] = useState(true);
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [phoneForWa, setPhoneForWa] = useState(DEFAULT_WA_NUMBER);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Payment flow state
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    consultationType: string;
    amountPaid: number;
    date: string;
    time: string;
    bookingReference: string;
  } | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayLoadAttempted = useRef(false);

  const selectedFormat = useMemo(
    () => formats.find((f) => f.id === selectedFormatId) ?? null,
    [formats, selectedFormatId],
  );

  // Load Razorpay checkout script
  useEffect(() => {
    if (razorpayLoadAttempted.current) return;
    razorpayLoadAttempted.current = true;

    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script");
      toast.error("Payment system could not be loaded. Please refresh.");
    };
    document.head.appendChild(script);
  }, []);

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
          .then((data: PublicTestimonial[] | undefined) => setTestimonials(Array.isArray(data) ? data : [])),
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

    listFormats()
      .then((data: any) => {
        const formatsList = data as ConsultationFormat[];
        setFormats(formatsList);
        setLoadingFormats(false);
        if (data.length > 0 && !selectedFormatId) {
          setSelectedFormatId(data[0]!.id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch formats:", err);
        setLoadingFormats(false);
      });
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

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.trim().length < 10 || !/^\+?[\d\s()-]+$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!selectedFormatId) newErrors.type = "Please select a consultation type";
    if (!selectedDate) {
      newErrors.date = "Please select a date";
    } else if (selectedDate < today) {
      newErrors.date = "Date cannot be in the past";
    }
    if (!selectedTime) newErrors.time = "Please select a time";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, email, selectedFormatId, selectedDate, selectedTime, today]);

  const handlePayment = useCallback(async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create the booking
      const dateStr = [
        selectedDate!.getFullYear(),
        String(selectedDate!.getMonth() + 1).padStart(2, "0"),
        String(selectedDate!.getDate()).padStart(2, "0"),
      ].join("-");

      const submitRes: any = await submitConsultation({
        data: {
          body: {
            name: name.trim(),
            contact: phone.trim(),
            email: email.trim() || undefined,
            formatId: selectedFormatId,
            date: dateStr,
            time: selectedTime,
            note: message.trim() || undefined,
          },
        },
      });

      if (submitRes?.error) {
        toast.error(typeof submitRes.error === "string" ? submitRes.error : "Could not submit your request. Please try again.");
        setSubmitting(false);
        return;
      }

      const booking = submitRes;
      setBookingId(booking.id);

      // Step 2: Create Razorpay order
      const orderRes: any = await createPaymentOrder({
        data: {
          body: {
            consultationId: booking.id,
          },
        },
      });

      if (orderRes?.error) {
        toast.error(typeof orderRes.error === "string" ? orderRes.error : "Could not create payment order. Please try again.");
        setSubmitting(false);
        return;
      }

      const orderData = orderRes;

      // Step 3: Open Razorpay Checkout
      if (!razorpayLoaded || !(window as unknown as Record<string, unknown>)["Razorpay"]) {
        toast.error("Payment system not ready. Please wait a moment and try again.");
        setSubmitting(false);
        return;
      }

      const RazorpayConstructor = (window as unknown as Record<string, unknown>)["Razorpay"] as {
        new (options: Record<string, unknown>): {
          open: () => void;
          on: (event: string, handler: () => void) => void;
        };
      };

      const rzp = new RazorpayConstructor({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Swayam Goyal & Associates",
        description: selectedFormat?.name ?? "Consultation",
        order_id: orderData.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim() || undefined,
          contact: phone.trim(),
        },
        theme: {
          color: "#1a73e8",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes: any = await verifyPayment({
              data: {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  consultationId: booking.id,
                },
              },
            });

            if (!verifyRes?.error) {
              const verifyData = verifyRes;
              if (verifyData.success) {
                setPaymentSuccess(true);
                setPaymentDetails({
                  consultationType: selectedFormat?.name ?? "Consultation",
                  amountPaid: orderData.amount / 100,
                  date: selectedDate ? selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : dateStr,
                  time: selectedTime,
                  bookingReference: booking.id,
                });
                toast.success("Payment successful! Your consultation has been booked.");
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                toast.error("Payment verification failed. Please contact support.");
              }
            } else {
              toast.error(typeof verifyRes.error === "string" ? verifyRes.error : "Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Could not verify payment. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment window closed. Your booking is held for 15 minutes.");
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again or contact us for assistance.");
        setSubmitting(false);
      });

      rzp.open();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }, [validate, name, phone, email, selectedFormatId, selectedDate, selectedTime, message, selectedFormat, razorpayLoaded]);

  const handleRetryPayment = useCallback(async () => {
    setPaymentSuccess(false);
    setPaymentDetails(null);
    // The booking ID is already set, so we just need to try payment again
    setSubmitting(true);
    try {
      const orderRes: any = await createPaymentOrder({
        data: {
          body: {
            consultationId: bookingId!,
          },
        },
      });

      if (orderRes?.error) {
        toast.error(typeof orderRes.error === "string" ? orderRes.error : "Could not create payment order.");
        setSubmitting(false);
        return;
      }

      const orderData = orderRes;

      if (!razorpayLoaded || !(window as unknown as Record<string, unknown>)["Razorpay"]) {
        toast.error("Payment system not ready. Please wait.");
        setSubmitting(false);
        return;
      }

      const RazorpayConstructor = (window as unknown as Record<string, unknown>)["Razorpay"] as {
        new (options: Record<string, unknown>): {
          open: () => void;
          on: (event: string, handler: () => void) => void;
        };
      };

      const rzp = new RazorpayConstructor({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Swayam Goyal & Associates",
        description: selectedFormat?.name ?? "Consultation",
        order_id: orderData.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim() || undefined,
          contact: phone.trim(),
        },
        theme: { color: "#1a73e8" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes: any = await verifyPayment({
              data: {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  consultationId: bookingId!,
                },
              },
            });

            if (!verifyRes?.error) {
              const verifyData = verifyRes;
              if (verifyData.success) {
                setPaymentSuccess(true);
                setPaymentDetails({
                  consultationType: selectedFormat?.name ?? "Consultation",
                  amountPaid: orderData.amount / 100,
                  date: selectedDate ? selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "",
                  time: selectedTime,
                  bookingReference: bookingId!,
                });
                toast.success("Payment successful! Your consultation has been booked.");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          } catch {
            // handled below
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment window closed.");
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setSubmitting(false);
      });

      rzp.open();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }, [bookingId, selectedFormat, name, phone, email, razorpayLoaded]);

  // Success view
  if (paymentSuccess && paymentDetails) {
    return (
      <main>
        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-secondary px-6 py-24 text-secondary-foreground sm:px-10 sm:py-32 lg:px-16">
          <HeroBanner
            src="/consultation-room.jpg"
            alt="Consultation room"
          />
          <Reveal className="relative z-10 mx-auto w-full max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="mb-4">
              <SectionKicker>Payment Successful</SectionKicker>
            </div>
            <h1 className="text-3xl font-display leading-tight sm:text-4xl">
              Your consultation request has been booked successfully.
            </h1>
            <p className="mt-4 text-sm text-secondary-foreground/70">
              We will review your booking and confirm the appointment. You will receive a confirmation shortly.
            </p>

            <Card className="mt-8 text-left">
              <CardContent className="p-6 space-y-3">
                <BookingDetail label="Consultation Type" value={paymentDetails.consultationType} />
                <BookingDetail label="Amount Paid" value={`${(paymentDetails.amountPaid / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                <BookingDetail label="Preferred Date" value={paymentDetails.date} />
                <BookingDetail label="Preferred Time" value={paymentDetails.time} />
                <BookingDetail label="Booking Reference" value={paymentDetails.bookingReference} mono />
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                onClick={handleRetryPayment}
                variant="outline"
                className="rounded-xl border border-border px-5 py-3 text-xs font-bold uppercase tracking-[0.14em]"
              >
                Book Another Consultation
              </Button>
              <Button
                asChild
                className="rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
              >
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>
    );
  }

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
            Fill in your details and proceed to payment to confirm your appointment.
          </p>
          <div className="mt-5">
            <AvailabilityBadge isActive={isActive} />
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-2xl">
          {/* Fee note */}
          <Reveal className="mb-8">
            <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Fee adjustable against work engaged.</span>{" "}
                The consultation fee will be credited toward any engagement you proceed with.
              </p>
            </div>
          </Reveal>

          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="mt-6 space-y-6" noValidate>
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

            {/* Email */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Email <span className="text-muted-foreground">(Optional)</span>
              </label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: "" })); }}
                  placeholder="your@email.com"
                  aria-label="Email"
                  aria-invalid={!!errors.email}
                  className={`h-12 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring ${errors.email ? "border-destructive" : "border-input"}`}
                />
              </div>
              {errors.email && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Consultation Type */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Consultation Type <span className="text-destructive">*</span>
              </label>
              <div className="mt-2">
                <Select
                  value={selectedFormatId}
                  onValueChange={(val) => {
                    setSelectedFormatId(val);
                    if (errors.type) setErrors((prev) => ({ ...prev, type: "" }));
                  }}
                  disabled={loadingFormats}
                >
                  <SelectTrigger
                    aria-invalid={!!errors.type}
                    className={errors.type ? "border-destructive" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="size-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder={loadingFormats ? "Loading types..." : "Select a consultation type"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((fmt) => (
                      <SelectItem key={fmt.id} value={fmt.id}>
                        <div className="flex flex-col">
                          <span>{fmt.name}</span>
                          <span className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="size-3" />
                              {fmt.fee.toLocaleString("en-IN")}
                            </span>
                            {" "}
                            {fmt.duration}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.type && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.type}</p>}

              {selectedFormat && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <DollarSign className="size-3.5 shrink-0 text-primary" />
                  <span>
                    <span className="font-semibold text-foreground">{selectedFormat.fee.toLocaleString("en-IN")}</span>
                    {" — "}
                    {selectedFormat.note}
                    {" · "}
                    {selectedFormat.duration}
                  </span>
                </div>
              )}
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

            {/* Short Message / Note */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Short Message <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="mt-2 relative">
                <MessageSquare className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                <Textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); }}
                  placeholder="Briefly describe what you'd like to discuss..."
                  rows={3}
                  aria-label="Short message"
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            {/* Submit / Payment Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="magnetic-button h-auto w-full rounded-xl bg-primary px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="size-4" />
                  Proceed to Payment
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

function BookingDetail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-[var(--color-muted-foreground)]">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
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
