import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
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
  { to: "/admin/consultations", icon: CalendarCheck, label: "Consultations" },
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isLoginPage) {
    return <Outlet />;
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">Swayam Goyal</span>
              <span className="text-xs text-muted-foreground">&amp; Associates</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
                inactiveProps={{
                  className: "text-muted-foreground hover:bg-accent hover:text-foreground",
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <div className="mb-3 flex items-center gap-3 px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                {session.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{session.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View site
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayout,
});
