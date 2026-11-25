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
import { Train, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface Station {
  id: string;
  name: string;
  code: string;
  createdAt: string;
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
                    <TableHead>منابع داده</TableHead>
                    <TableHead>اینکلاینومتر</TableHead>
                    <TableHead>کاربران با دسترسی</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell><code className="font-mono font-semibold">{s.code}</code></TableCell>
                      <TableCell>{s._count.dataSources}</TableCell>
                      <TableCell>{s._count.inclinometerImages}</TableCell>
                      <TableCell>{s._count.userAccess}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("fa-IR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
