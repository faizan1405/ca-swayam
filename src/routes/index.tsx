import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BadgeCheck, Building2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-boardroom.jpg";
import industrialImage from "@/assets/industrial-plans.jpg";
import auditImage from "@/assets/audit-ledger.jpg";
import logoAsset from "@/assets/swayam-goyal-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { HeroBanner, Magnetic, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { getPublicServices } from "@/lib/backend/services";
import { getPublicSettings } from "@/lib/backend/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chartered Accountants for Growing Businesses | Swayam Goyal & Associates" },
      {
        name: "description",
        content:
          "Industrial subsidy, GST, income tax, audit, and bank finance support from Swayam Goyal & Associates in Surajpur.",
      },
      {
        property: "og:title",
        content: "Chartered Accountants for Growing Businesses | Swayam Goyal & Associates",
      },
      {
        property: "og:description",
        content:
          "Industrial subsidy, GST, income tax, audit, and bank finance support from Surajpur since 2017.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Service = {
  id: string;
  number: string;
  title: string;
  sortOrder: number;
};

type PublicSettings = Record<string, { value: string; type: string }>;

function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<PublicSettings>({});
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    getPublicServices()
      .then((res) => res.json())
      .then((data: Service[]) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {
        // ignore
      });
    getPublicSettings()
      .then((res) => res.json())
      .then((data: PublicSettings) => setSettings(data ?? {}))
      .catch(() => {
        // ignore
      });
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

  const heroTitle =
    settings["hero_title"]?.value ?? "Chartered Accountants for Growing Businesses in Chhattisgarh";
  const heroSubtitle =
    settings["hero_subtitle"]?.value ??
    "Industrial subsidy, GST, income tax, audit, and bank finance — since 2017, from Surajpur.";
  const establishedYear = settings["established_year"]?.value ?? "2017";
  const icaiMembership = settings["icai_membership"]?.value ?? "437708";
  const frn = settings["frn"]?.value ?? "024178C";
  const teamSize = settings["team_size"]?.value ?? "10";
  const firmTagline = settings["firm_tagline"]?.value ?? "Chartered Accountants";

  const sorted = [...services].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);

  return (
    <main>
      <section className="relative flex min-h-[780px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:min-h-[860px] sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner
          src={heroImage}
          alt="Leather-bound ledger and architectural plans on a boardroom table"
          opacity="opacity-70"
        />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <Reveal>
            <div className="mb-8 flex items-center gap-4">
              <img
                src={logoAsset.url}
                alt="Swayam Goyal & Associates"
                width={360}
                height={216}
                className="h-20 w-auto max-w-[220px] rounded-lg bg-background/95 object-contain p-2 shadow-2xl sm:h-28 sm:max-w-[300px]"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                {firmTagline}
              </span>
            </div>
            <h1 className="max-w-5xl font-display text-5xl leading-[0.95] tracking-normal text-balance sm:text-7xl lg:text-8xl">
              {heroTitle}
            </h1>
            <div className="mt-8 h-px w-28 bg-primary" />
            <p className="mt-8 max-w-2xl text-lg leading-8 text-secondary-foreground/78 sm:text-xl">
              {heroSubtitle}
            </p>
            <div className="mt-6">
              <AvailabilityBadge isActive={isActive} />
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                className="magnetic-button h-auto rounded-xl bg-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
              >
                <Link to="/consultation">
                  Book a Consultation <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto rounded-xl border-secondary-foreground/35 bg-secondary/20 px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
              >
                <a
                  href={`mailto:${settings["email"]?.value ?? "swayamsoffice@gmail.com"}?subject=Client%20login%20enquiry`}
                >
                  Client Login
                </a>
              </Button>
            </div>
          </Reveal>
          <Reveal className="delay-2">
            <div className="border-l border-primary/70 pl-5 font-mono text-[10px] uppercase tracking-[0.16em] text-secondary-foreground/70">
              <p>
                Est. {establishedYear} · ICAI M.No. {icaiMembership} · FRN {frn}
              </p>
              <p className="mt-4 flex items-center gap-2 text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {teamSize}-Member Team
              </p>
              <p className="mt-2">Surajpur | Raipur, Chhattisgarh</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border bg-background px-6 py-7 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <BadgeCheck className="size-4 text-primary" /> ICAI M.No. {icaiMembership}
          </div>
          <div className="flex items-center gap-3">
            <Users className="size-4 text-primary" /> {teamSize}-Member Team
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="size-4 text-primary" /> Surajpur | Raipur, Chhattisgarh
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="image-frame aspect-[4/3]">
              <img
                src={industrialImage}
                alt="Industrial plans, copper ruler and fountain pen on a deep teal desk"
                width={1200}
                height={800}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <SectionKicker>Practice areas</SectionKicker>
              <h2 className="mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
                Professional specializations, clearly arranged.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                A focused practice across industrial subsidy, statutory and bank audit, GST, income
                tax, accounting, tendering, and MSME advisory.
              </p>
            </Reveal>
            {sorted.length > 0 && (
              <div className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {sorted.map((service, index) => (
                  <Reveal key={service.id} className={`delay-${Math.min((index % 4) + 1, 4)}`}>
                    <Link
                      to="/services"
                      className="group flex items-start gap-4 border-t border-border py-4"
                    >
                      <span className="font-mono text-[10px] text-primary">{service.number}</span>
                      <span className="text-sm font-medium text-foreground/80 transition-colors group-hover:text-primary">
                        {service.title}
                      </span>
                      <ArrowRight className="ml-auto size-4 text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-muted/55 px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <SectionKicker>About the firm</SectionKicker>
            <h2 className="mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
              A practice based in Surajpur, with a second office in Raipur.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground">
              Founded in {establishedYear}, Swayam Goyal & Associates is a {teamSize}-member
              Chartered Accountancy practice serving businesses in Chhattisgarh across a focused
              range of practice areas.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                className="magnetic-button rounded-xl bg-secondary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-secondary-foreground hover:bg-secondary"
              >
                <Link to="/about">
                  Read about the firm <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground hover:bg-accent"
              >
                <Link to="/contact">Find an office</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal className="delay-2">
            <div className="image-frame aspect-[4/3]">
              <img
                src={auditImage}
                alt="Leather-bound ledger and audit papers on an ivory desk"
                width={1200}
                height={800}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-primary px-6 py-20 sm:px-10 lg:px-16">
        <Reveal className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionKicker>Start a conversation</SectionKicker>
            <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-primary-foreground sm:text-5xl">
              GST notice, subsidy application, or loan proposal pending? Let’s talk.
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="magnetic-button h-auto shrink-0 rounded-xl border-primary-foreground/45 bg-primary px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/consultation">
              Book a Consultation <ArrowUpRight />
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
