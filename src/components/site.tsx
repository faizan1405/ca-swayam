"use client";

import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Button } from "@/components/ui/button";

const logoUrl = "/swayam-goyal-logo.png";

export type ContactInfo = {
  phoneNumber: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  addressSurajpur: string;
  addressRaipur: string;
  icaiMembership: string;
  frn: string;
};

const emptyContact: ContactInfo = {
  phoneNumber: "9617072100",
  whatsappNumber: "919617072100",
  whatsappMessage: "Hi, I'd like to speak with Swayam Goyal & Associates about a consultation.",
  email: "swayamsoffice@gmail.com",
  addressSurajpur: "1st Floor, Goyal Bhawan, In Front of SBI, Main Road, Surajpur 497229",
  addressRaipur: "",
  icaiMembership: "437708",
  frn: "024178C",
};

export function useContactInfo() {
  const [contact, setContact] = useState<ContactInfo>(emptyContact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { getPublicSettings } = await import("@/lib/backend/settings");
        const res = await getPublicSettings();
        if (!res.ok) throw new Error("Failed to load settings");
        const data = (await res.json()) as Record<string, { value: string }>;

        if (cancelled) return;

        const get = (key: string, fallback: string) => data[key]?.value ?? fallback;

        setContact({
          phoneNumber: get("phone_number", emptyContact.phoneNumber),
          whatsappNumber: get("whatsapp_number", emptyContact.whatsappNumber),
          whatsappMessage: get("whatsapp_message", emptyContact.whatsappMessage),
          email: get("email", emptyContact.email),
          addressSurajpur: get("address_surajpur", emptyContact.addressSurajpur),
          addressRaipur: get("address_raipur", emptyContact.addressRaipur),
          icaiMembership: get("icai_membership", emptyContact.icaiMembership),
          frn: get("frn", emptyContact.frn),
        });
      } catch {
        // keep fallback values
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { contact, loading };
}

export type AvailabilityStatus = {
  isActive: boolean;
};

export function useAvailabilityStatus() {
  const [status, setStatus] = useState<AvailabilityStatus>({ isActive: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { getPublicSiteInfo } = await import("@/lib/backend/siteInfo");
        const res = await getPublicSiteInfo();
        if (!res.ok) throw new Error("Failed to load availability");
        const data = await res.json();
        if (cancelled) return;
        setStatus({ isActive: data?.isActive ?? true });
      } catch {
        // keep default
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, loading };
}

export function AvailabilityBadge({ isActive, className = "" }: { isActive: boolean; className?: string }) {
  if (isActive) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 ${className}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        Online / Available
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground ${className}`}
    >
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
      Currently Inactive
    </span>
  );
}

/* ---------------- Scroll reveal ---------------- */

export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as "div";
  return (
    <Component ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </Component>
  );
}

/* ---------------- Parallax hero banner ---------------- */

export function HeroBanner({
  src,
  alt,
  opacity = "opacity-60",
}: {
  src: string;
  alt: string;
  opacity?: string;
}) {
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.min(window.scrollY, 700) * 0.14;
        node.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={`absolute inset-0 size-full scale-105 object-cover object-center will-change-transform ${opacity}`}
      />
      <div className="absolute inset-0 bg-secondary/72" />
    </>
  );
}

/* ---------------- Magnetic wrapper ---------------- */

export function Magnetic({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const onMove = (event: ReactMouseEvent<HTMLSpanElement>) => {
    const node = ref.current;
    if (!node || !fine) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = () => {
    const node = ref.current;
    if (node) node.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-flex transition-transform duration-500 ease-out ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">{children}</div>
  );
}

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.33 4.94L2 22l5.35-1.4a9.83 9.83 0 0 0 4.69 1.19h.01c5.43 0 9.85-4.42 9.85-9.86 0-2.63-1.02-5.11-2.88-6.97A9.79 9.79 0 0 0 12.04 2Zm0 17.94h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.17.83.85-3.1-.2-.31a8.15 8.15 0 0 1-1.25-4.36c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.86 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.25-8.16 8.25Z" />
    </svg>
  );
}

/* ---------------- Header ---------------- */

export function SiteHeader({ phoneNumber }: { phoneNumber: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-3 transition-all duration-500 sm:px-6 ${scrolled ? "py-2 sm:py-3" : "py-3 sm:py-5"}`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-xl transition-all duration-500 sm:px-5 ${scrolled ? "border-border bg-background/95 editorial-shadow" : "border-primary/20 bg-background/70"}`}
      >
        <Link
          to="/"
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-3"
          aria-label="Swayam Goyal & Associates home"
        >
          <img
            src={logoUrl}
            alt="Swayam Goyal & Associates"
            width={360}
            height={216}
            className="h-12 w-auto max-w-[150px] shrink-0 object-contain sm:h-16 sm:max-w-[210px]"
          />
          <span className="hidden border-l border-border pl-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground xl:block">
            Est. 2017
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <Magnetic>
            <Button
              asChild
              className="magnetic-button rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary-foreground hover:bg-secondary"
            >
              <Link to="/consultation">
                Book a Consultation <ArrowUpRight />
              </Link>
            </Button>
          </Magnetic>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="rounded-full text-foreground"
            aria-label="Call the firm"
          >
            <a href={`tel:${phoneNumber}`}>
              <Phone />
            </a>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full text-foreground"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <nav
        className={`mx-auto grid max-w-7xl gap-1 overflow-hidden rounded-2xl border border-border bg-background/98 px-3 backdrop-blur-xl transition-all duration-500 lg:hidden ${open ? "mt-2 max-h-96 py-3 opacity-100 editorial-shadow" : "pointer-events-none max-h-0 border-transparent py-0 opacity-0"}`}
        aria-label="Mobile navigation"
      >
        <MobileNavLink to="/" onClick={closeMenu}>
          Home
        </MobileNavLink>
        <MobileNavLink to="/services" onClick={closeMenu}>
          Services
        </MobileNavLink>
        <MobileNavLink to="/about" onClick={closeMenu}>
          About
        </MobileNavLink>
        <MobileNavLink to="/contact" onClick={closeMenu}>
          Contact
        </MobileNavLink>
        <MobileNavLink to="/consultation" onClick={closeMenu}>
          Book a Consultation
        </MobileNavLink>
      </nav>
    </header>
  );
}

function NavLink({
  to,
  children,
}: {
  to: "/" | "/services" | "/about" | "/contact";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "text-primary" }}
      className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70 transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  to,
  children,
  onClick,
}: {
  to: "/" | "/services" | "/about" | "/contact" | "/consultation";
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "bg-accent text-accent-foreground" }}
      className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
    >
      {children}
    </Link>
  );
}

/* ---------------- Footer ---------------- */

export function SiteFooter({
  phoneNumber,
  whatsappUrl,
  email,
  addressSurajpur,
  addressRaipur,
  icaiMembership,
  frn,
  isActive,
}: {
  phoneNumber: string;
  whatsappUrl: string;
  email: string;
  addressSurajpur: string;
  addressRaipur: string;
  icaiMembership: string;
  frn: string;
  isActive?: boolean;
}) {
  return (
    <footer className="border-t border-border bg-secondary px-6 py-14 text-secondary-foreground sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="inline-flex rounded-2xl bg-background/95 p-4">
            <img
              src={logoUrl}
              alt="Swayam Goyal & Associates"
              width={360}
              height={216}
              loading="lazy"
              className="h-20 w-auto max-w-[220px] object-contain"
            />
          </div>
          <p className="mt-6 max-w-sm text-sm leading-7 text-secondary-foreground/70">
            Swayam Goyal &amp; Associates, Chartered Accountants. Founded in 2017, with offices in
            Surajpur and Raipur, Chhattisgarh.
          </p>
          {isActive !== undefined && (
            <div className="mt-4">
              {isActive ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                  Online / Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
                  Currently Inactive
                </span>
              )}
            </div>
          )}
        </div>
        <div>
          <SectionKicker>Explore</SectionKicker>
          <div className="mt-5 grid gap-3 text-sm text-secondary-foreground/75">
            <Link to="/services" className="transition-colors hover:text-primary">
              Services
            </Link>
            <Link to="/about" className="transition-colors hover:text-primary">
              About the firm
            </Link>
            <Link to="/contact" className="transition-colors hover:text-primary">
              Contact
            </Link>
            <Link to="/consultation" className="transition-colors hover:text-primary">
              Book a consultation
            </Link>
          </div>
        </div>
        <div>
          <SectionKicker>Direct contact</SectionKicker>
          <div className="mt-5 grid gap-3 text-sm text-secondary-foreground/75">
            <a href={`tel:${phoneNumber}`} className="transition-colors hover:text-primary">
              +91 {phoneNumber.slice(0, 5)} {phoneNumber.slice(5)}
            </a>
            <a href={`mailto:${email}`} className="break-all transition-colors hover:text-primary">
              {email}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-primary"
            >
              WhatsApp the firm
            </a>
            <address className="not-italic leading-7 text-secondary-foreground/60">
              {addressSurajpur}
              {addressRaipur && addressRaipur !== "Full address pending confirmation." && (
                <>
                  <br />
                  <span className="text-xs uppercase tracking-wider text-secondary-foreground/40">
                    Raipur:
                  </span>{" "}
                  {addressRaipur}
                </>
              )}
            </address>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-secondary-foreground/15 pt-6 text-[10px] uppercase tracking-[0.16em] text-secondary-foreground/45 sm:flex-row sm:items-center sm:justify-between">
        <span>
          ICAI M.No. {icaiMembership} · FRN {frn}
        </span>
        <span>© 2026 Swayam Goyal &amp; Associates</span>
      </div>
    </footer>
  );
}

export function WhatsAppFloat({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Message Swayam Goyal & Associates on WhatsApp"
      className="float-gently fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-xs font-semibold text-secondary shadow-[0_12px_34px_color-mix(in_oklab,var(--whatsapp)_34%,transparent)] transition-transform duration-500 hover:scale-105 sm:bottom-7 sm:right-7"
    >
      <WhatsAppIcon />
      <span className="hidden sm:inline">Consult on WhatsApp</span>
    </a>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const { contact } = useContactInfo();
  const { status } = useAvailabilityStatus();
  const whatsappUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage)}`;

  return (
    <div className="page-wrap">
      <SiteHeader phoneNumber={contact.phoneNumber} />
      {children}
      <WhatsAppFloat whatsappUrl={whatsappUrl} />
      <SiteFooter
        phoneNumber={contact.phoneNumber}
        whatsappUrl={whatsappUrl}
        email={contact.email}
        addressSurajpur={contact.addressSurajpur}
        addressRaipur={contact.addressRaipur}
        icaiMembership={contact.icaiMembership}
        frn={contact.frn}
        isActive={status.isActive}
      />
    </div>
  );
}
