"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Activity, Loader2 } from "lucide-react";
import Link from "next/link";

interface LogRow {
  id: string;
  userId: string | null;
  username: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "ورود",
  LOGOUT: "خروج",
  VIEW_STATION: "مشاهده ایستگاه",
  CREATE_USER: "ایجاد کاربر",
  EDIT_USER: "ویرایش کاربر",
  DELETE_USER: "حذف کاربر",
  UPDATE_USER_ACCESS: "تغییر دسترسی کاربر",
  CREATE_STATION: "ایجاد ایستگاه",
  UPLOAD_DATA_SOURCE: "آپلود منبع داده",
  CONFIGURE_DATA_SOURCE: "پیکربندی منبع داده",
  DELETE_DATA_SOURCE: "حذف منبع داده",
  UPLOAD_INCLINOMETER_IMAGE: "آپلود عکس اینکلاینومتر",
};

export default function ActivityLogPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = React.useState<LogRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState("");

  async function load() {
    setLoading(true);
    const qs = actionFilter ? `?action=${actionFilter}&limit=200` : "?limit=200";
    try {
      const res = await fetch(`/api/admin/activity${qs}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (user?.role === "ADMIN") load();
  }, [user, actionFilter]);

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
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">لاگ فعالیت</h1>
          </div>
          <Link href="/admin"><Button variant="outline" size="sm">بازگشت</Button></Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{total} رویداد</CardTitle>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="">همه عملیات</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>زمان</TableHead>
                    <TableHead>کاربر</TableHead>
                    <TableHead>عملیات</TableHead>
                    <TableHead>منبع</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>جزئیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(l.timestamp).toLocaleString("fa-IR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ACTION_LABELS[l.action] || l.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{l.resourceType || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{l.ip || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{l.details || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">رویدادی ثبت نشده است</TableCell></TableRow>
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
