import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Briefcase, Eye, EyeOff } from "lucide-react";
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

type Service = {
  id: string;
  number: string;
  title: string;
  label: string;
  description: string;
  items: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type FormData = {
  number: string;
  title: string;
  label: string;
  description: string;
  items: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormData = {
  number: "01",
  title: "",
  label: "",
  description: "",
  items: "",
  sortOrder: 0,
  isActive: true,
};

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Services | Admin" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { getAllServices } = await import("@/lib/backend/services");
      const res = await getAllServices();
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

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      number: s.number,
      title: s.title,
      label: s.label,
      description: s.description,
      items: Array.isArray(s.items) ? s.items.join("\n") : (s.items ?? ""),
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const { updateService } = await import("@/lib/backend/services");
        const url = new URL(window.location.origin + "/admin/services");
        url.searchParams.set("id", editingId);
        await updateService({ data: { url: url.toString(), body: form } });
        toast.success("Service updated");
      } else {
        const { createService } = await import("@/lib/backend/services");
        await createService({ data: { body: form } });
        toast.success("Service created");
      }

      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      const { deleteService } = await import("@/lib/backend/services");
      await deleteService({
        data: { url: window.location.origin + `/admin/services?id=${id}` },
      });
      toast.success("Service deleted");
      await load();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const handleToggle = async (s: Service) => {
    try {
      const { updateService } = await import("@/lib/backend/services");
      await updateService({
        data: {
          url: window.location.origin + `/admin/services?id=${s.id}`,
          body: { isActive: !s.isActive },
        },
      });
      toast.success(s.isActive ? "Service hidden from website" : "Service published to website");
      await load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = items.filter((s) => s.isActive).length;
  const hiddenCount = items.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your services and offerings
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Total</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="font-display text-2xl font-semibold">{items.length}</span>
            <p className="text-xs text-muted-foreground">services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Published</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{activeCount}</span>
            <p className="text-xs text-muted-foreground">visible on site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Hidden</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="font-display text-2xl font-semibold text-amber-600 dark:text-amber-500">{hiddenCount}</span>
            <p className="text-xs text-muted-foreground">not visible</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>
            {items.length} service{items.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No services yet. Click "Add Service" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Label</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.number}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {s.title}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {s.label}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {s.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "default" : "secondary"}>
                          {s.isActive ? "Published" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(s)}
                            className="h-8 w-8 p-0"
                            title={s.isActive ? "Hide from website" : "Publish to website"}
                          >
                            {s.isActive ? (
                              <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span className="sr-only">{s.isActive ? "Hide" : "Publish"}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(s)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.id)}
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
            <DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the service details below."
                : "Fill in the details for the new service."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Number</Label>
                <Input
                  id="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Primary Service"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Industrial Piping"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Service description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">Items / Features</Label>
              <Textarea
                id="items"
                value={form.items}
                onChange={(e) => setForm({ ...form, items: e.target.value })}
                placeholder="One item per line, e.g.&#10;Design&#10;Supply&#10;Installation"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">One feature per line.</p>
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
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Service"}
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
