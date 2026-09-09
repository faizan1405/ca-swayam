import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Quote, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  place: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type FormData = {
  quote: string;
  name: string;
  place: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormData = {
  quote: "",
  name: "",
  place: "",
  sortOrder: 0,
  isActive: true,
};

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials | Admin" }] }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { getAllTestimonials } = await import("@/lib/backend/testimonials");
      const res = await getAllTestimonials();
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({
      quote: t.quote,
      name: t.name,
      place: t.place,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = new URL(window.location.origin + "/admin/testimonials");

      if (editingId) {
        url.searchParams.set("id", editingId);
        const { updateTestimonial } = await import("@/lib/backend/testimonials");
        await updateTestimonial({ data: { url: url.toString(), body: form } });
        toast.success("Testimonial updated");
      } else {
        const payload = {
          ...form,
          id: "tst_" + Math.random().toString(36).slice(2),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const { createTestimonial } = await import("@/lib/backend/testimonials");
        await createTestimonial({ data: { url: url.toString(), body: payload } });
        toast.success("Testimonial created");
      }

      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to save testimonial");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    try {
      const { deleteTestimonial } = await import("@/lib/backend/testimonials");
      await deleteTestimonial({
        data: { url: window.location.origin + `/admin/testimonials?id=${id}` },
      });
      toast.success("Testimonial deleted");
      await load();
    } catch {
      toast.error("Failed to delete testimonial");
    }
  };

  const handleToggle = async (t: Testimonial) => {
    try {
      const { updateTestimonial } = await import("@/lib/backend/testimonials");
      await updateTestimonial({
        data: {
          url: window.location.origin + `/admin/testimonials?id=${t.id}`,
          body: { isActive: !t.isActive },
        },
      });
      toast.success(
        t.isActive ? "Testimonial hidden from website" : "Testimonial published to website",
      );
      await load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = items.filter((t) => t.isActive).length;
  const hiddenCount = items.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Manage client testimonials and reviews
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{items.length}</span>
            <p className="text-xs text-[var(--color-muted-foreground)]">testimonials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Published
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
            <p className="text-xs text-[var(--color-muted-foreground)]">visible on site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Hidden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-500">
              {hiddenCount}
            </span>
            <p className="text-xs text-[var(--color-muted-foreground)]">not visible</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Testimonials</CardTitle>
          <CardDescription>
            {items.length} testimonial{items.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              Loading…
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
              No testimonials yet. Click "Add Testimonial" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Place</TableHead>
                    <TableHead className="hidden lg:table-cell">Quote</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-[var(--color-muted-foreground)]">
                        {t.place}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-start gap-2 max-w-sm">
                          <Quote className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]" />
                          <span className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                            {t.quote}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-[var(--color-muted-foreground)]">
                        {formatDate(t.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isActive ? "default" : "secondary"}>
                          {t.isActive ? "Published" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(t)}
                            className="h-8 w-8 p-0"
                            title={t.isActive ? "Hide from website" : "Publish to website"}
                          >
                            {t.isActive ? (
                              <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span className="sr-only">{t.isActive ? "Hide" : "Publish"}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(t)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the testimonial details below."
                : "Fill in the details for the new testimonial."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place">Place / Location</Label>
              <Input
                id="place"
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="e.g. Raipur, Chhattisgarh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                placeholder="Client testimonial..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <select
                  id="isActive"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="true">Published</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
