"use client";

import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Instrument } from "@/lib/instrument-data";

interface DataTableViewProps {
  instruments: Instrument[];
}

export function DataTableView({ instruments }: DataTableViewProps) {
  // Build a flat table: one row per instrument, columns: code, label, type, status, lastReading, lastDelta, threshold
  const rows = instruments.map((ins) => ({
    id: ins.id,
    code: ins.code,
    label: ins.label,
    type: ins.type,
    status: ins.status,
    lastReading: ins.lastReading,
    lastDelta: ins.lastDelta,
    unit: ins.unit,
    warning: ins.threshold.warning,
    alarm: ins.threshold.alarm,
    updatedAt: ins.updatedAt,
    seriesCount: ins.series?.length || 1,
    readingsCount: ins.readings.length,
  }));

  const typeLabels: Record<string, string> = {
    extensometer: "اکستنسومتر",
    inclinometer: "اینکلاینومتر",
    tiltmeter: "تیلت‌متر",
    observation_well: "چاه مشاهده‌ای",
    jointmeter: "درزسنج",
  };

  const statusLabels: Record<string, string> = {
    normal: "عادی",
    warning: "هشدار",
    alarm: "آلارم",
    offline: "آفلاین",
  };

  const statusColors: Record<string, string> = {
    normal: "text-emerald-600",
    warning: "text-amber-600",
    alarm: "text-red-600",
    offline: "text-muted-foreground",
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          داده‌ای برای نمایش وجود ندارد. ابتدا از پنل مدیریت منبع داده آپلود و پیکربندی کنید.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">کد ابزار</TableHead>
                <TableHead className="min-w-[150px]">برچسب</TableHead>
                <TableHead className="min-w-[100px]">نوع</TableHead>
                <TableHead className="min-w-[80px]">وضعیت</TableHead>
                <TableHead className="min-w-[100px] text-left">آخرین قرائت</TableHead>
                <TableHead className="min-w-[100px] text-left">تغییر از مبنا</TableHead>
                <TableHead className="min-w-[80px] text-left">حد هشدار</TableHead>
                <TableHead className="min-w-[80px] text-left">حد آلارم</TableHead>
                <TableHead className="min-w-[60px] text-left">تعداد سری</TableHead>
                <TableHead className="min-w-[80px] text-left">تعداد قرائت</TableHead>
                <TableHead className="min-w-[120px] text-left">آخرین به‌روزرسانی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-semibold">{r.code}</TableCell>
                  <TableCell className="text-sm">{r.label}</TableCell>
                  <TableCell className="text-sm">{typeLabels[r.type] || r.type}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${statusColors[r.status]}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-left font-mono text-xs">
                    {r.lastReading.toFixed(2)} {r.unit}
                  </TableCell>
                  <TableCell className={`text-left font-mono text-xs ${r.lastDelta > 0 ? "text-amber-600" : r.lastDelta < 0 ? "text-blue-600" : ""}`}>
                    {r.lastDelta > 0 ? "+" : ""}{r.lastDelta.toFixed(2)} {r.unit}
                  </TableCell>
                  <TableCell className="text-left font-mono text-xs text-amber-600">
                    {r.warning} {r.unit}
                  </TableCell>
                  <TableCell className="text-left font-mono text-xs text-red-600">
                    {r.alarm} {r.unit}
                  </TableCell>
                  <TableCell className="text-left text-xs">{r.seriesCount}</TableCell>
                  <TableCell className="text-left text-xs">{r.readingsCount}</TableCell>
                  <TableCell className="text-left text-xs text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
