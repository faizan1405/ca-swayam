import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import serviceHero from "@/assets/audit-ledger.jpg";
import serviceImage from "@/assets/industrial-plans.jpg";
import { Button } from "@/components/ui/button";
import { HeroBanner, Magnetic, Reveal, SectionKicker } from "@/components/site";
import { getPublicServices } from "@/lib/backend/services";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services | Swayam Goyal & Associates" },
      {
        name: "description",
        content:
          "Industrial subsidy, audit, GST, income tax, accounting, tendering, and MSME advisory services.",
      },
      { property: "og:title", content: "Services | Swayam Goyal & Associates" },
      {
        property: "og:description",
        content:
          "A focused range of Chartered Accountancy services for businesses in Chhattisgarh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

type Service = {
  id: string;
  number: string;
  title: string;
  label: string;
  description: string;
  items: string[];
  sortOrder: number;
};

function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicServices()
      .then((res) => res.json())
      .then((data: Service[]) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, []);

  const services = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main>
      <section className="relative flex min-h-[520px] items-end overflow-hidden bg-secondary px-6 pb-14 pt-36 text-secondary-foreground sm:min-h-[600px] sm:px-10 sm:pb-20 lg:px-16">
        <HeroBanner
          src={serviceHero}
          alt="Leather-bound ledger and audit papers on an ivory desk"
        />
        <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
          <SectionKicker>Practice areas</SectionKicker>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.02] sm:text-6xl lg:text-7xl">
            Professional specializations.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-secondary-foreground/75 sm:text-lg">
            A clear list of the services offered by Swayam Goyal &amp; Associates.
          </p>
        </Reveal>
      </section>

      <section className="px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <Reveal>
              <div className="image-frame aspect-[4/3]">
                <img
                  src={serviceImage}
                  alt="Industrial site plans with copper ruler and fountain pen"
                  width={1200}
                  height={800}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal className="delay-1">
              <SectionKicker>Confirmed services</SectionKicker>
              <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
                The work, without unnecessary categories.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                Each area below reflects the confirmed practice scope of the firm.
              </p>
            </Reveal>
          </div>

          {loading ? (
            <div className="mt-14 text-center text-sm text-muted-foreground">Loading services…</div>
          ) : services.length === 0 ? (
            <div className="mt-14 text-center text-sm text-muted-foreground">
              No services configured yet.
            </div>
          ) : (
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {services.map((service, index) => (
                <Reveal
                  key={service.id}
                  className={`${index === 0 ? "md:col-span-2" : ""} delay-${Math.min((index % 4) + 1, 4)}`}
                >
                  <article className="group h-full rounded-2xl border border-border bg-card p-6 editorial-shadow transition-all duration-700 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_26px_80px_color-mix(in_oklab,var(--primary)_14%,transparent)] sm:p-8">
                    <div className="flex items-start gap-5">
                      <span className="font-mono text-xs text-primary">{service.number}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <h3 className="font-display text-2xl sm:text-3xl">{service.title}</h3>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            {service.label}
                          </span>
                        </div>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                          {service.description}
                        </p>
                        {service.items.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {service.items.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-xs text-foreground/75"
                              >
                                <Check className="size-3 text-primary" />
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="size-5 shrink-0 text-primary transition-transform duration-500 group-hover:translate-x-1" />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal className="mt-16 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              For a focused discussion about a matter, choose a consultation format and time.
            </p>
            <Magnetic>
              <Button
                asChild
                className="magnetic-button rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary"
              >
                <Link to="/consultation">
                  Book a Consultation <ArrowRight />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
