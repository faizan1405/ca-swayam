import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, MessageSquare, Mail, BookOpen, Star, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Swayam Goyal & Associates" }] }),
  component: DashboardPage,
});

type Stats = {
  services: number;
  testimonials: number;
  pendingConsultations: number;
  confirmedConsultations: number;
  contactEntries: number;
};

type RecentTestimonial = {
  id: string;
  quote: string;
  name: string;
  place: string;
  isActive: boolean;
  createdAt: string | Date;
};

function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTestimonials, setRecentTestimonials] = useState<RecentTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getAdminStats } = await import("@/lib/backend/admin");
        const data = await getAdminStats();
        setStats({
          services: toCount(data.services),
          testimonials: toCount(data.testimonials),
          pendingConsultations: toCount(data.pendingConsultations),
          confirmedConsultations: toCount(data.confirmedConsultations),
          contactEntries: toCount(data.contactTotal),
        });
      } catch {
        toast.error("Failed to load dashboard stats");
      }
    };

    const loadRecent = async () => {
      try {
        const { getAllTestimonials } = await import("@/lib/backend/testimonials");
        const res = await getAllTestimonials();
        if (res.ok) {
          const data = await res.json();
          const sorted = (Array.isArray(data) ? data : [])
            .sort(
              (a: RecentTestimonial, b: RecentTestimonial) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .slice(0, 5);
          setRecentTestimonials(sorted);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    Promise.all([loadStats(), loadRecent()]);
  }, []);

  const cards = stats
    ? [
        {
          title: "Services",
          value: stats.services,
          description: "Active service offerings",
          icon: Briefcase,
          href: "/admin/services",
        },
        {
          title: "Testimonials",
          value: stats.testimonials,
          description: "Client reviews",
          icon: MessageSquare,
          href: "/admin/testimonials",
        },
        {
          title: "Consultation Requests",
          value: stats.pendingConsultations + stats.confirmedConsultations,
          description: `${stats.pendingConsultations} pending · ${stats.confirmedConsultations} confirmed`,
          icon: BookOpen,
          href: "/admin/consultations",
        },
        {
          title: "Contact Entries",
          value: stats.contactEntries,
          description: "Form enquiries",
          icon: Mail,
          href: "/admin/contact-entries",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Overview of your website
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2 pb-3">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link to={card.href} key={card.title} className="no-underline">
              <Card className="h-full transition-shadow duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      {card.title}
                    </CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-primary)]/10">
                      <card.icon className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl font-semibold tracking-tight">{card.value}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                      Manage <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickAction to="/admin/settings" label="Update website information" />
            <QuickAction to="/admin/contact-entries" label="Review contact entries" />
            <QuickAction to="/admin/consultations" label="Review consultation requests" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--color-primary)]" />
              Recently added testimonials
            </CardTitle>
            <CardDescription>
              {recentTestimonials.length > 0 ? "Latest client reviews" : "No testimonials yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTestimonials.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Add your first testimonial to see it here.
              </p>
            ) : (
              <div className="space-y-0">
                {recentTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-b border-border last:border-0 py-3 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {t.quote}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--color-muted-foreground)] whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </span>
                      <Badge
                        variant={t.isActive ? "default" : "secondary"}
                        className="text-[10px] h-5"
                      >
                        {t.isActive ? "Published" : "Hidden"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-accent no-underline text-[var(--color-foreground)]"
    >
      <span>{label}</span>
      <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
    </Link>
  );
}

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function toCount(value: unknown): number {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}
