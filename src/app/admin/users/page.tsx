"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Users, Plus, Loader2, Trash2, Edit, ShieldCheck, Eye } from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "VIEWER";
  createdAt: string;
  lastLoginAt: string | null;
  _count: { stationAccess: number };
}

interface Station {
  id: string;
  name: string;
  code: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [stations, setStations] = React.useState<Station[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [accessUser, setAccessUser] = React.useState<UserRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [ures, sres] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stations"),
      ]);
      const ud = await ures.json();
      const sd = await sres.json();
      setUsers(ud.users || []);
      setStations(sd.stations || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (currentUser?.role === "ADMIN") load();
  }, [currentUser]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <p className="text-lg">دسترسی به این بخش فقط برای مدیران مجاز است</p>
          <Link href="/" className="mt-4 inline-block text-primary underline">بازگشت به داشبورد</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="outline" size="sm">بازگشت به مدیریت</Button></Link>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> کاربر جدید
            </Button>
          </div>
        </div>

        {/* Users table */}
        <Card>
          <CardHeader><CardTitle>کاربران سامانه ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام کاربری</TableHead>
                    <TableHead>نام نمایشی</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead>دسترسی ایستگاه‌ها</TableHead>
                    <TableHead>آخرین ورود</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono">{u.username}</TableCell>
                      <TableCell>{u.displayName}</TableCell>
                      <TableCell>
                        {u.role === "ADMIN" ? (
                          <Badge className="gap-1 bg-purple-500/15 text-purple-600 dark:text-purple-300">
                            <ShieldCheck className="h-3 w-3" /> مدیر
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" /> مشاهده‌گر
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.role === "ADMIN" ? "همه ایستگاه‌ها" : `${u._count.stationAccess} ایستگاه`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("fa-IR") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.role === "VIEWER" && (
                            <Button size="sm" variant="outline" onClick={() => setAccessUser(u)}>
                              <Edit className="h-3.5 w-3.5" /> دسترسی
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        کاربری ثبت نشده است
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create user dialog */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stations={stations}
        onCreated={() => { setCreateOpen(false); load(); }}
      />

      {/* Edit access dialog */}
      {accessUser && (
        <AccessDialog
          user={accessUser}
          stations={stations}
          onClose={() => setAccessUser(null)}
        />
      )}
    </div>
  );
}

// ─── Create user dialog ──────────────────────────────────────────────

function CreateUserDialog({
  open, onOpenChange, stations, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stations: Station[];
  onCreated: () => void;
}) {
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "VIEWER">("VIEWER");
  const [selectedStations, setSelectedStations] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username, displayName, password, role,
          stationIds: role === "VIEWER" ? selectedStations : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در ایجاد کاربر");
        return;
      }
      setUsername(""); setDisplayName(""); setPassword("");
      setRole("VIEWER"); setSelectedStations([]);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد کاربر جدید</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>نام کاربری</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="مثلا user1" />
          </div>
          <div className="space-y-1.5">
            <Label>نام نمایشی</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="نام کامل" />
          </div>
          <div className="space-y-1.5">
            <Label>رمز عبور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۴ کاراکتر" />
          </div>
          <div className="space-y-1.5">
            <Label>نقش</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={role === "VIEWER" ? "default" : "outline"}
                onClick={() => setRole("VIEWER")}
              >مشاهده‌گر</Button>
              <Button
                type="button"
                size="sm"
                variant={role === "ADMIN" ? "default" : "outline"}
                onClick={() => setRole("ADMIN")}
              >مدیر</Button>
            </div>
          </div>
          {role === "VIEWER" && (
            <div className="space-y-1.5">
              <Label>دسترسی به ایستگاه‌ها</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {stations.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedStations.includes(s.id)}
                      onCheckedChange={(v) => {
                        if (v) setSelectedStations([...selectedStations, s.id]);
                        else setSelectedStations(selectedStations.filter((x) => x !== s.id));
                      }}
                    />
                    <span>{s.name} <code className="text-xs text-muted-foreground">({s.code})</code></span>
                  </label>
                ))}
                {stations.length === 0 && (
                  <p className="text-xs text-muted-foreground">ابتدا یک ایستگاه بسازید</p>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={submit} disabled={saving || !username || !password || !displayName}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ایجاد کاربر"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Access editor dialog ────────────────────────────────────────────

function AccessDialog({
  user, stations, onClose,
}: {
  user: UserRow;
  stations: Station[];
  onClose: () => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [original, setOriginal] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}`);
        const data = await res.json();
        const ids = (data.user?.stationAccess || []).map((a: { station: { id: string } }) => a.station.id);
        setSelected(ids);
        setOriginal(ids);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...original].sort());

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationIds: selected }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "خطا در ذخیره");
        return;
      }
      setOriginal([...selected]);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>دسترسی ایستگاه‌ها — {user.displayName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              ایستگاه‌هایی که این کاربر می‌تواند داده‌های آنها را مشاهده کند:
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
              {stations.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(s.id)}
                    onCheckedChange={(v) => {
                      if (v) setSelected([...selected, s.id]);
                      else setSelected(selected.filter((x) => x !== s.id));
                    }}
                  />
                  <span>{s.name} <code className="text-xs text-muted-foreground">({s.code})</code></span>
                </label>
              ))}
            </div>
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره دسترسی"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
