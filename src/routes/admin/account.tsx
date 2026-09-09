import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Session = { adminId: string; email: string; name: string };

export const Route = createFileRoute("/admin/account")({
  head: () => ({ meta: [{ title: "Account | Admin" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    import("@/lib/backend/admin").then(({ getAdminSession }) =>
      getAdminSession()
        .then((s) => {
          if (s) {
            setSession(s);
            setName(s.name);
            setEmail(s.email);
          }
        })
        .finally(() => setLoading(false)),
    );
  }, []);

  const handleSaveProfile = async () => {
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const { updateAdminProfile } = await import("@/lib/backend/admin");
      const res = await updateAdminProfile({
        data: { body: { name, email } },
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMessage({ type: "error", text: data.error ?? "Failed to update profile" });
        return;
      }
      setSession((s) => (s ? { ...s, name, email } : s));
      setProfileMessage({ type: "success", text: "Profile updated" });
    } catch {
      setProfileMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPasswordSaving(true);
    try {
      const { changePassword } = await import("@/lib/backend/admin");
      const res = await changePassword({
        data: { body: { currentPassword, newPassword } },
      });
      const data = await res.json();
      if (!res.ok) {
        let message = data.error ?? "Failed to update password";
        if (typeof message === "object") message = "Validation error";
        setPasswordMessage({ type: "error", text: message });
        return;
      }
      setPasswordMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Manage your admin account
          </p>
        </div>
        <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Manage your admin account details and password
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your display name and email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          {profileMessage && (
            <div
              role="alert"
              className={`rounded-md border p-3 text-sm ${
                profileMessage.type === "success"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/50 bg-destructive/10 text-destructive"
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={profileSaving || !name || !email}>
              <Save className="mr-2 h-4 w-4" />
              {profileSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Choose a new password with at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleChangePassword();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {passwordMessage && (
              <div
                role="alert"
                className={`rounded-md border p-3 text-sm ${
                  passwordMessage.type === "success"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/50 bg-destructive/10 text-destructive"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              >
                <Save className="mr-2 h-4 w-4" />
                {passwordSaving ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
