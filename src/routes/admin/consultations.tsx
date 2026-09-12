import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IndianRupee, Trash2, Search } from "lucide-react";
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

export const Route = createFileRoute("/admin/consultations")({
  head: () => ({ meta: [{ title: "Consultations | Admin" }] }),
  component: ConsultationsPage,
});

type Consultation = {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  formatId: string | null;
  fee: number | null;
  date: string | Date;
  time: string;
  status: "pending_payment" | "pending" | "confirmed" | "cancelled" | "completed" | "payment_failed";
  note: string | null;
  createdAt: string | Date;
  consultationType: string | null;
  consultationDuration: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentStatus: string | null;
  paymentVerifiedAt: string | Date | null;
  currency: string | null;
  amountPaid: number | null;
};

const statusLabels: Record<
  Consultation["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "warning" }
> = {
  pending_payment: { label: "Awaiting Payment", variant: "outline" },
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  payment_failed: { label: "Payment Failed", variant: "destructive" },
};

const paymentStatusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  paid: { label: "Paid", variant: "default" },
  pending_payment: { label: "Awaiting Payment", variant: "outline" },
  payment_failed: { label: "Failed", variant: "destructive" },
};

function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Consultation["status"]>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { listConsultations } = await import("@/lib/backend/consultations");
      const url =
        filter === "all" ? "/admin/consultations" : `/admin/consultations?status=${filter}`;
      const data = await listConsultations({
        data: { url: window.location.origin + url },
      }).then((r) => r.json());
      setItems(data.items ?? []);
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

  const handleStatusChange = async (id: string, status: Consultation["status"]) => {
    const { updateConsultationStatus } = await import("@/lib/backend/consultations");
    await updateConsultationStatus({
      data: {
        url: window.location.origin + `/admin/consultations?id=${id}`,
        body: { status },
      },
    });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this consultation? This cannot be undone.")) return;
    const { deleteConsultation } = await import("@/lib/backend/consultations");
    await deleteConsultation({
      data: { url: window.location.origin + `/admin/consultations?id=${id}` },
    });
    await load();
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.contact.toLowerCase().includes(q) ||
      (item.consultationType ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultations</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Manage consultation bookings and payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Bookings</CardTitle>
              <CardDescription>{items.length} consultations</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  placeholder="Search name, contact, or type"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 sm:w-64"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending_payment">Awaiting Payment</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              No consultations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Booking Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div>
                          {c.name}
                          {c.email && (
                            <p className="text-xs text-[var(--color-muted-foreground)]">{c.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                        {c.contact}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.consultationType || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.fee != null ? (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="size-3" />
                            {c.fee.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(c.date)}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                        {c.time}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const ps = c.paymentStatus || c.status;
                          const info = paymentStatusLabels[ps] ?? {
                            label: ps,
                            variant: "outline" as const,
                          };
                          return (
                            <div className="space-y-1">
                              <Badge variant={info.variant} className="text-[10px] h-5">
                                {info.label}
                              </Badge>
                              {c.razorpayPaymentId && (
                                <p className="text-[10px] text-[var(--color-muted-foreground)] font-mono truncate max-w-[140px]">
                                  {c.razorpayPaymentId}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.amountPaid != null ? (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="size-3" />
                            {(c.amountPaid / 100).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.status}
                          onValueChange={(v) =>
                            handleStatusChange(c.id, v as Consultation["status"])
                          }
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([key, info]) => (
                              <SelectItem key={key} value={key}>
                                {info.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
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

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
