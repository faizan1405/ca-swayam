import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type SettingValue = {
  value: string;
  type: "text" | "number" | "boolean" | "json";
};

type Settings = Record<string, SettingValue>;

// Group settings for display
const SETTINGS_GROUPS: { title: string; description: string; keys: string[] }[] = [
  {
    title: "Firm Information",
    description: "Basic firm identity and credentials",
    keys: ["firm_name", "firm_tagline", "icai_membership", "frn", "established_year", "team_size"],
  },
  {
    title: "Contact",
    description: "Phone, email, WhatsApp, and other contact details",
    keys: ["phone_number", "whatsapp_number", "email", "whatsapp_message"],
  },
  {
    title: "Addresses",
    description: "Office addresses",
    keys: ["address_surajpur", "address_raipur"],
  },
  {
    title: "Hero Section",
    description: "Homepage hero text",
    keys: ["hero_title", "hero_subtitle"],
  },
  {
    title: "Consultation",
    description: "Consultation booking configuration",
    keys: ["consultation_times"],
  },
  {
    title: "Misc",
    description: "Other website configuration",
    keys: ["show_testimonials_note"],
  },
];

const LABELS: Record<string, string> = {
  firm_name: "Firm Name",
  firm_tagline: "Firm Tagline",
  icai_membership: "ICAI Membership Number",
  frn: "Firm Registration Number (FRN)",
  established_year: "Established Year",
  team_size: "Team Size",
  phone_number: "Phone Number",
  whatsapp_number: "WhatsApp Number (with country code)",
  email: "Email Address",
  whatsapp_message: "WhatsApp Default Message",
  address_surajpur: "Surajpur Office Address",
  address_raipur: "Raipur Office Address",
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
  consultation_times: "Consultation Time Slots (JSON array)",
  show_testimonials_note: "Show Testimonials Note",
};

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings | Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    try {
      const { getAllSettings } = await import("@/lib/backend/settings");
      const res = await getAllSettings(new Request(window.location.origin + "/admin/settings"));
      if (res.ok) {
        const data = await res.json();
        setSettings(data ?? {});
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Load availability status
    (async () => {
      try {
        const { getPublicSiteInfo } = await import("@/lib/backend/siteInfo");
        const res = await getPublicSiteInfo();
        if (res.ok) {
          const data = await res.json();
          setAvailabilityStatus(data?.isActive ?? true);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSave = async (key: string) => {
    const value = editing[key];
    if (value === undefined) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const { updateSetting } = await import("@/lib/backend/settings");
      const meta = settings[key];
      const url = new URL(window.location.origin + "/admin/settings");
      url.searchParams.set("key", key);
      await updateSetting(
        new Request(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, type: meta?.type ?? "text" }),
        }),
      );
      await load();
      setEditing((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    } catch {
      alert("Failed to update setting");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleAvailabilityToggle = async (checked: boolean) => {
    const previousStatus = availabilityStatus;
    setAvailabilityStatus(checked);
    setAvailabilityLoading(true);
    try {
      const { updateAvailabilityStatus } = await import("@/lib/backend/siteInfo");
      const res = await updateAvailabilityStatus(
        new Request(window.location.origin + "/admin/settings/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: checked }),
        }),
      );
      if (res.ok) {
        toast.success(checked ? "CA is now Online / Active" : "CA is now Inactive / Offline");
      } else {
        throw new Error("Failed to update");
      }
    } catch {
      setAvailabilityStatus(previousStatus);
      toast.error("Failed to update availability status. Please try again.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleRefresh = () => {
    setEditing({});
    load();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Website Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your website's content and contact information
          </p>
        </div>
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Website Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your website's content and contact information
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Availability Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>CA Availability Status</CardTitle>
          <CardDescription>
            Control whether the CA appears as Online or Inactive on the public website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${availabilityStatus ? "bg-green-500/10" : "bg-muted"}`}>
                {availabilityStatus ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {availabilityStatus ? "Online / Active" : "Inactive / Offline"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {availabilityStatus
                    ? "Visitors will see the CA as available for consultations"
                    : "Visitors will see the CA as currently unavailable"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-shrink-0">
              <span className={`text-xs font-medium ${availabilityStatus ? "text-green-500" : "text-muted-foreground"}`}>
                {availabilityStatus ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={availabilityStatus}
                onCheckedChange={handleAvailabilityToggle}
                disabled={availabilityLoading}
              />
            </div>
          </div>
          {availabilityLoading && (
            <p className="mt-2 text-xs text-muted-foreground">Updating status…</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {SETTINGS_GROUPS.map((group) => {
          const groupKeys = group.keys.filter((k) => settings[k]);
          if (groupKeys.length === 0) return null;

          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupKeys.map((key) => {
                  const meta = settings[key];
                  if (!meta) return null;
                  const isEditing = editing[key] !== undefined;
                  const currentValue = isEditing ? editing[key] : meta.value;
                  const isLong =
                    key === "address_surajpur" ||
                    key === "address_raipur" ||
                    key === "hero_subtitle" ||
                    key === "whatsapp_message" ||
                    meta.type === "json";
                  const isBool = meta.type === "boolean";

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={key}>{LABELS[key] ?? key}</Label>
                        <span className="text-xs text-muted-foreground">{meta.type}</span>
                      </div>

                      {isBool ? (
                        <select
                          id={key}
                          value={currentValue}
                          onChange={(e) => setEditing((ed) => ({ ...ed, [key]: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : isLong ? (
                        <Textarea
                          id={key}
                          value={currentValue}
                          onChange={(e) => setEditing((ed) => ({ ...ed, [key]: e.target.value }))}
                          rows={meta.type === "json" ? 3 : 2}
                          className="font-mono text-xs"
                        />
                      ) : (
                        <Input
                          id={key}
                          value={currentValue}
                          onChange={(e) => setEditing((ed) => ({ ...ed, [key]: e.target.value }))}
                        />
                      )}

                      {isEditing && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing((ed) => {
                                const next = { ...ed };
                                delete next[key];
                                return next;
                              })
                            }
                            disabled={saving[key]}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleSave(key)} disabled={saving[key]}>
                            <Save className="mr-2 h-3 w-3" />
                            {saving[key] ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
