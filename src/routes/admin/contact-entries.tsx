import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Trash2, Mail, Phone, CalendarIcon, ClockIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/contact-entries")({
  head: () => ({ meta: [{ title: "Contact Entries | Admin" }] }),
  component: ContactEntriesPage,
});

type ContactEntry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: string | Date;
  preferredTime: string;
  isRead: boolean;
  createdAt: string | Date;
};

function ContactEntriesPage() {
  const [items, setItems] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const load = async () => {
    setLoading(true);
    try {
      const { getAllContactEntries } = await import("@/lib/backend/services");
      const url =
        filter === "all" ? "/admin/contact-entries" : `/admin/contact-entries?status=${filter}`;
      const data = await getAllContactEntries().then((r) => r.json());
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleMarkRead = async (id: string) => {
    try {
      const { markContactEntryRead } = await import("@/lib/backend/services");
      await markContactEntryRead({
        data: { url: window.location.origin + `/admin/contact-entries/read?id=${id}` },
      });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      toast.success("Marked as read");
    } catch {
      toast.error("Could not update entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact entry? This cannot be undone.")) return;
    try {
      const { deleteContactEntry } = await import("@/lib/backend/services");
      await deleteContactEntry({
        data: { url: window.location.origin + `/admin/contact-entries?id=${id}` },
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Entry deleted");
    } catch {
      toast.error("Could not delete entry");
    }
  };

  const filtered = items.filter((item) => {
    if (filter === "unread") return !item.isRead;
    if (filter === "read") return item.isRead;
    return true;
  });

  const unreadCount = items.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact Entries</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {items.length} total · {unreadCount} unread
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Enquiries</CardTitle>
              <CardDescription>Form submissions from the contact page</CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entries</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              No contact entries found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Preferred Appointment</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className={!c.isRead ? "bg-accent/30" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {!c.isRead && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                          )}
                          {c.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="size-3 text-[var(--color-muted-foreground)]" />
                            <a href={`mailto:${c.email}`} className="hover:text-primary">
                              {c.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="size-3 text-[var(--color-muted-foreground)]" />
                            <a href={`tel:${c.phone}`} className="hover:text-primary">
                              {c.phone}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-3 text-[var(--color-muted-foreground)]" />
                            {formatContactDate(c.preferredDate)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="size-3 text-[var(--color-muted-foreground)]" />
                            {c.preferredTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p
                          className="truncate text-sm text-[var(--color-muted-foreground)]"
                          title={c.message}
                        >
                          {c.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.isRead ? "secondary" : "default"}
                          className="text-[10px] h-5"
                        >
                          {c.isRead ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!c.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(c.id)}
                              className="h-8 w-8 p-0 text-[var(--color-muted-foreground)] hover:text-primary"
                              title="Mark as read"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                          <Link to="/contact" className="inline-flex" title="View contact page">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[var(--color-muted-foreground)] hover:text-primary"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="sr-only">Open contact</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatContactDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
