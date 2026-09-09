import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Briefcase,
  MessageSquare,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "@tanstack/react-router";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/consultations", icon: CalendarCheck, label: "Consultation Requests" },
  { to: "/admin/contact-entries", icon: Mail, label: "Contact Entries" },
  { to: "/admin/services", icon: Briefcase, label: "Services" },
  { to: "/admin/testimonials", icon: MessageSquare, label: "Testimonials" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
  { to: "/admin/account", icon: UserCog, label: "Account" },
];

function AdminLayout() {
  const [session, setSession] = useState<{
    adminId: string;
    email: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const isLoginPage = router.state.location.pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    import("@/lib/backend/admin").then(({ getAdminSession }) =>
      getAdminSession()
        .then((s) => {
          setSession(s);
          if (!s) {
            window.location.href = "/admin/login";
          }
        })
        .finally(() => setLoading(false)),
    );
  }, [isLoginPage]);

  const handleLogout = async () => {
    try {
      await import("@/lib/backend/admin").then(({ adminLogout }) => adminLogout());
    } catch {
      // Best effort logout
    }
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (isLoginPage) {
    return <Outlet />;
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Toaster position="top-right" richColors />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col
          border-r border-[var(--sidebar-border)]
          bg-[var(--sidebar-bg)]
          text-[var(--sidebar-text)]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--sidebar-border)] px-5">
          <Link to="/admin" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">
              SG
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-white">Swayam Goyal</span>
              <span className="block text-[11px] text-[var(--sidebar-text-muted)]">
                & Associates
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--sidebar-text-muted)] transition hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink item={item} onNavigate={() => setSidebarOpen(false)} />
              </li>
            ))}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sidebar-bg-active)] text-sm font-semibold text-white">
              {session.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{session.name}</p>
              <p className="truncate text-xs text-[var(--sidebar-text-muted)]">{session.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--sidebar-text-muted)] transition-colors duration-150 hover:bg-[var(--sidebar-bg-hover)] hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              View site
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  onNavigate: () => void;
}) {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isActive =
    item.to === "/admin"
      ? pathname === "/admin"
      : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`
        flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
        transition-all duration-150 no-underline outline-none
        ${
          isActive
            ? "bg-[var(--sidebar-bg-active)] text-[var(--sidebar-text-active)]"
            : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-bg-hover)] hover:text-white"
        }
      `}
    >
      <item.icon
        className={`h-[18px] w-[18px] shrink-0 ${
          isActive ? "text-white" : "text-[var(--sidebar-text-muted)]"
        }`}
      />
      {item.label}
    </Link>
  );
}

export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayout,
});
