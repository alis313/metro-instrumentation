"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet, Plus, Loader2, Trash2, Settings, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface DataSource {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  analyzedAt: string | null;
  station: { id: string; name: string; code: string };
  uploadedBy: { username: string; displayName: string };
  _count: { sheets: number };
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "در انتظار", variant: "secondary" },
  CONFIGURED: { label: "پیکربندی‌شده", variant: "default" },
  ACTIVE: { label: "فعال", variant: "default" },
  ARCHIVED: { label: "بایگانی", variant: "outline" },
};

export default function DataSourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const [dataSources, setDataSources] = React.useState<DataSource[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data-sources");
      const data = await res.json();
      setDataSources(data.dataSources || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (user?.role === "ADMIN") load();
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm("این منبع داده و تمام تنظیمات شیت‌های آن حذف شود؟")) return;
    await fetch(`/api/admin/data-sources/${id}`, { method: "DELETE" });
    load();
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
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">منابع داده</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="outline" size="sm">بازگشت به مدیریت</Button></Link>
            <Link href="/admin/data-sources/new"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> منبع داده جدید</Button></Link>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>فایل‌های آپلودشده ({dataSources.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام فایل</TableHead>
                    <TableHead>ایستگاه</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>شیت‌ها</TableHead>
                    <TableHead>آپلود توسط</TableHead>
                    <TableHead>تاریخ آپلود</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataSources.map((ds) => {
                    const st = STATUS_LABELS[ds.status] || { label: ds.status, variant: "outline" as const };
                    return (
                      <TableRow key={ds.id}>
                        <TableCell className="font-mono text-xs">{ds.fileName}</TableCell>
                        <TableCell>{ds.station.name} <code className="text-xs text-muted-foreground">({ds.station.code})</code></TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>{ds._count.sheets}</TableCell>
                        <TableCell className="text-xs">{ds.uploadedBy.displayName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(ds.uploadedAt).toLocaleDateString("fa-IR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link href={`/admin/data-sources/${ds.id}`}>
                              <Button size="sm" variant="outline"><Settings className="h-3.5 w-3.5" /> پیکربندی</Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(ds.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {dataSources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        هنوز فایلی آپلود نشده است.
                        <Link href="/admin/data-sources/new" className="mt-2 inline-block text-primary underline">آپلود اولین فایل</Link>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
