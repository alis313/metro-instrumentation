"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Train, Plus, Loader2, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import Link from "next/link";

interface Station {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  layoutImagePath: string | null;
  _count: { dataSources: number; inclinometerImages: number; userAccess: number };
}

export default function AdminStationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = React.useState<Station[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [layoutStation, setLayoutStation] = React.useState<Station | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stations");
      const data = await res.json();
      setStations(data.stations || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (user?.role === "ADMIN") load();
  }, [user]);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا");
        return;
      }
      setName(""); setCode("");
      setOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div><p>دسترسی فقط برای مدیران</p><Link href="/" className="mt-4 inline-block text-primary underline">بازگشت</Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Train className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">مدیریت ایستگاه‌ها</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="outline" size="sm">بازگشت</Button></Link>
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> ایستگاه جدید</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>ایستگاه‌ها ({stations.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>کد</TableHead>
                    <TableHead>تصویر جانمایی</TableHead>
                    <TableHead>منابع داده</TableHead>
                    <TableHead>اینکلاینومتر</TableHead>
                    <TableHead>کاربران</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell><code className="font-mono font-semibold">{s.code}</code></TableCell>
                      <TableCell>
                        {s.layoutImagePath ? (
                          <span className="text-xs text-emerald-600">آپلود شده</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">ندارد</span>
                        )}
                      </TableCell>
                      <TableCell>{s._count.dataSources}</TableCell>
                      <TableCell>{s._count.inclinometerImages}</TableCell>
                      <TableCell>{s._count.userAccess}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setLayoutStation(s)} className="gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5" /> تصویر جانمایی
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create station dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ایستگاه جدید</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>نام ایستگاه</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلا ایستگاه شهدا" />
            </div>
            <div className="space-y-1.5">
              <Label>کد اختصاری</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="مثلا N3" className="font-mono" />
              <p className="text-xs text-muted-foreground">از حروف لاتین و اعداد استفاده کنید</p>
            </div>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={create} disabled={saving || !name || !code}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ایجاد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Layout image upload dialog */}
      {layoutStation && (
        <LayoutImageDialog
          station={layoutStation}
          onClose={() => { setLayoutStation(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Layout image upload dialog ──────────────────────────────────────

function LayoutImageDialog({
  station, onClose,
}: {
  station: Station;
  onClose: () => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Server-side upload: send file as multipart form data
      // The server uploads to Vercel Blob (production) or local filesystem (dev)
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/admin/stations/${station.id}/layout-image`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در آپلود تصویر");
        return;
      }
      onClose();
    } catch (err) {
      setError("خطا در آپلود: " + String(err));
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!confirm("تصویر جانمایی حذف شود؟")) return;
    setUploading(true);
    try {
      await fetch(`/api/admin/stations/${station.id}/layout-image`, { method: "DELETE" });
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تصویر جانمایی ابزار — {station.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Current image */}
          {station.layoutImagePath && (
            <div className="space-y-2">
              <Label>تصویر فعلی:</Label>
              <div className="overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={station.layoutImagePath} alt="جانمایی ابزار" className="w-full" />
              </div>
              <Button variant="outline" size="sm" onClick={remove} disabled={uploading} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> حذف تصویر فعلی
              </Button>
            </div>
          )}

          {/* Upload new image */}
          <div className="space-y-2">
            <Label>{station.layoutImagePath ? "تصویر جدید:" : "فایل تصویر:"}</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
            <p className="text-xs text-muted-foreground">
              عکس نقشه جانمایی ابزارهای دقیق این ایستگاه را آپلود کنید. این تصویر در تب «تصویر جانمایی» در داشبورد نمایش داده می‌شود.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button onClick={upload} disabled={!file || uploading} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            آپلود تصویر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
