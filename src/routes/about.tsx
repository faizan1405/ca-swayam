import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import aboutHero from "@/assets/consultation-room.jpg";
import aboutImage from "@/assets/office-reception.jpg";
import { Button } from "@/components/ui/button";
import { HeroBanner, Reveal, SectionKicker, AvailabilityBadge } from "@/components/site";
import { getPublicServices } from "@/lib/backend/services";
import { getPublicSettings } from "@/lib/backend/settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Firm | Swayam Goyal & Associates" },
      {
        name: "description",
        content:
          "Learn about Swayam Goyal & Associates, founded in 2017 with offices in Surajpur and Raipur.",
      },
      { property: "og:title", content: "About the Firm | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content:
          "A 10-member Chartered Accountancy practice based in Surajpur with a second office in Raipur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

type Service = { id: string; title: string };
type PublicSettings = Record<string, { value: string; type: string }>;

function AboutPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<PublicSettings>({});
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    getPublicServices()
      .then((res) => res.json())
      .then((data: Service[]) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
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

  const establishedYear = settings["established_year"]?.value ?? "2017";
  const teamSize = settings["team_size"]?.value ?? "10";
  const icaiMembership = settings["icai_membership"]?.value ?? "437708";

  return (
    <main>
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner
          src={aboutHero}
          alt="Two armchairs and a consultation table in a deep teal office"
        />
        <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
          <SectionKicker>The firm</SectionKicker>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] sm:text-7xl">
            Swayam Goyal & Associates.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-secondary-foreground/75">
            Founded in {establishedYear}, based in Surajpur with a second office in Raipur.
          </p>
          <div className="mt-6">
            <AvailabilityBadge isActive={isActive} />
          </div>
        </Reveal>
      </section>
      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.95fr]">
            <Reveal>
              <SectionKicker>Firm story</SectionKicker>
              <h2 className="mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
                A ten-member practice with a clear regional base.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground">
                Swayam Goyal & Associates is a Chartered Accountancy practice founded in{" "}
                {establishedYear}. The firm is based in Surajpur and has a second office in Raipur,
                Chhattisgarh.
              </p>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                Its practice areas include Industrial Subsidy, Audit including Bank Audit, GST
                Compliance and GST Litigation, Income Tax, Accounting & Book Keeping, Tendering, and
                MSME Advisory.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Fact icon={<BadgeCheck />} label="ICAI Membership" value={icaiMembership} />
                <Fact icon={<MapPin />} label="Locations" value="Surajpur · Raipur" />
                <Fact icon={<Users />} label="Team" value={`${teamSize} members`} />
              </div>
            </Reveal>
            <Reveal className="delay-2">
              <div className="image-frame aspect-[4/5]">
                <img
                  src={aboutImage}
                  alt="Modern office reception with deep teal wall and warm copper details"
                  width={1200}
                  height={800}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
            </Reveal>
          </div>
          <div className="mt-24 border-t border-border pt-10">
            <Reveal>
              <SectionKicker>Practice areas</SectionKicker>
              <div className="mt-7 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service.id}
                    className="rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground/75"
                  >
                    {service.title}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal className="mt-16 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              For office details or a consultation, contact the firm directly.
            </p>
            <Button
              asChild
              className="magnetic-button rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
            >
              <Link to="/contact">
                Contact the firm <ArrowRight />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 editorial-shadow">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 text-sm font-medium text-foreground/80">{value}</div>
    </div>
  );
}
