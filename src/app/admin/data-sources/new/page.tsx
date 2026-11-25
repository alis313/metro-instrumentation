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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet, Upload, Loader2, ArrowLeft, ArrowRight, Save, Wand2,
} from "lucide-react";
import Link from "next/link";

interface Station {
  id: string;
  name: string;
  code: string;
}

interface SheetAnalysis {
  sheetName: string;
  totalRows: number;
  totalCols: number;
  detectedHeaderRow: number;
  detectedDateCol: number;
  headerCells: string[];
  numericCols: Array<{ col: number; sample: number | null }>;
  dateCols: Array<{ col: number; sample: number | null }>;
  previewRows: unknown[][];
  suggestedInstrumentType: string;
}

interface SheetConfigInput {
  sheetName: string;
  enabled: boolean;
  instrumentType: string;
  instrumentCode: string;
  instrumentLabel: string;
  headerRow: number;
  dateCol: number;
  valueCols: Array<{ col: number; label: string }>;
  dateRangeStart: string;
  dateRangeEnd: string;
}

const TYPE_LABELS: Record<string, string> = {
  EXTENSOMETER: "اکستنسومتر",
  CRACKMETER: "ترک‌سنج",
  TILTMETER: "تیلت‌متر",
  OBSERVATION_WELL: "چاه مشاهده‌ای",
  INCLINOMETER: "اینکلاینومتر",
  OTHER: "سایر",
};

export default function NewDataSourcePage() {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = React.useState<Station[]>([]);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [stationId, setStationId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [dataSourceId, setDataSourceId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analyses, setAnalyses] = React.useState<SheetAnalysis[]>([]);
  const [configs, setConfigs] = React.useState<Record<string, SheetConfigInput>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.role === "ADMIN") {
      fetch("/api/admin/stations")
        .then((r) => r.json())
        .then((d) => setStations(d.stations || []));
    }
  }, [user]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <p>دسترسی به این بخش فقط برای مدیران مجاز است</p>
          <Link href="/" className="mt-4 inline-block text-primary underline">بازگشت</Link>
        </div>
      </div>
    );
  }

  // Step 1: choose station + file
  async function handleUpload() {
    if (!stationId || !file) return;
    setUploading(true);
    setError(null);
    try {
      // Server-side upload: send file as multipart form data
      // The server uploads to Vercel Blob (production) or local filesystem (dev)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("stationId", stationId);

      const res = await fetch("/api/admin/data-sources/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در آپلود فایل");
        return;
      }
      setDataSourceId(data.dataSource.id);
      setStep(2);
    } catch (err) {
      console.error("[upload] error:", err);
      setError("خطا در آپلود فایل: " + String(err));
    } finally {
      setUploading(false);
    }
  }

  // Step 2: analyze sheets
  async function handleAnalyze() {
    if (!dataSourceId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/data-sources/${dataSourceId}/analyze`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در تحلیل");
        return;
      }
      setAnalyses(data.sheets || []);
      const init: Record<string, SheetConfigInput> = {};
      for (const a of data.sheets || []) {
        init[a.sheetName] = {
          sheetName: a.sheetName,
          enabled: false,
          instrumentType: a.suggestedInstrumentType || "OTHER",
          instrumentCode: a.sheetName,
          instrumentLabel: "",
          headerRow: a.detectedHeaderRow,
          dateCol: a.detectedDateCol,
          valueCols: [],
          dateRangeStart: "",
          dateRangeEnd: "",
        };
      }
      setConfigs(init);
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
  }

  // Step 3: configure each sheet + save
  async function handleSave() {
    if (!dataSourceId) return;
    setSaving(true);
    setError(null);
    try {
      const sheets = Object.values(configs).filter((c) => c.enabled);
      const res = await fetch(`/api/admin/data-sources/${dataSourceId}/configure`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheets }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "خطا در ذخیره");
        return;
      }
      window.location.href = "/admin/data-sources";
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">افزودن منبع داده جدید</h1>
          </div>
          <Link href="/admin/data-sources"><Button variant="outline" size="sm">بازگشت</Button></Link>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          {[
            { n: 1, label: "انتخاب ایستگاه و فایل" },
            { n: 2, label: "تحلیل ساختار" },
            { n: 3, label: "پیکربندی شیت‌ها" },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${step === s.n ? "bg-primary text-primary-foreground" : step > s.n ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <span>{s.n}</span> <span>{s.label}</span>
              </div>
              {i < 2 && <ArrowLeft className="h-3 w-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Step 1: station + file */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>۱. انتخاب ایستگاه و آپلود فایل</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>ایستگاه</Label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger><SelectValue placeholder="یک ایستگاه انتخاب کنید" /></SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {stations.length === 0 && (
                  <p className="text-xs text-muted-foreground">ابتدا از صفحه مدیریت ایستگاه‌ها یک ایستگاه بسازید.</p>
                )}
                <Link href="/admin/stations" className="text-xs text-primary underline">مدیریت ایستگاه‌ها</Link>
              </div>
              <div className="space-y-1.5">
                <Label>فایل اکسل (.xls / .xlsx)</Label>
                <Input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file && <p className="text-xs text-muted-foreground">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
              </div>
              <Button onClick={handleUpload} disabled={!stationId || !file || uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                آپلود فایل
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: analyze */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>۲. تحلیل ساختار فایل</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                فایل با موفقیت آپلود شد. حالا ساختار شیت‌ها را تحلیل می‌کنیم تا هدرها، ستون‌های تاریخ و ستون‌های عددی شناسایی شوند.
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                تحلیل ساختار
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: configure sheets */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>۳. پیکربندی شیت‌ها ({analyses.length} شیت)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  برای هر شیت که شامل ابزار است، آن را فعال کنید و نوع ابزار، سطر هدر، ستون تاریخ و ستون‌های مقدار را مشخص کنید. بازه تاریخ اختیاری است.
                </p>
              </CardContent>
            </Card>

            {analyses.map((a) => (
              <SheetConfigCard
                key={a.sheetName}
                analysis={a}
                config={configs[a.sheetName]}
                onChange={(cfg) => setConfigs({ ...configs, [a.sheetName]: cfg })}
              />
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>مرحله قبل</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                ذخیره پیکربندی
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Per-sheet config card ───────────────────────────────────────────

function SheetConfigCard({
  analysis, config, onChange,
}: {
  analysis: SheetAnalysis;
  config: SheetConfigInput;
  onChange: (cfg: SheetConfigInput) => void;
}) {
  if (!config) return null;
  const update = (patch: Partial<SheetConfigInput>) => onChange({ ...config, ...patch });

  const toggleValueCol = (col: number) => {
    const exists = config.valueCols.find((v) => v.col === col);
    if (exists) {
      update({ valueCols: config.valueCols.filter((v) => v.col !== col) });
    } else {
      const header = analysis.headerCells[col] || `Col ${col}`;
      update({ valueCols: [...config.valueCols, { col, label: header }] });
    }
  };

  return (
    <Card className={config.enabled ? "" : "opacity-80"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{analysis.sheetName}</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{analysis.totalRows} ردیف × {analysis.totalCols} ستون</Badge>
            <Badge variant="secondary">{TYPE_LABELS[analysis.suggestedInstrumentType] || analysis.suggestedInstrumentType}</Badge>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={config.enabled}
                onCheckedChange={(v) => update({ enabled: !!v })}
              />
              <span>فعال</span>
            </label>
          </div>
        </div>
      </CardHeader>
      {config.enabled && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">نوع ابزار</Label>
              <Select value={config.instrumentType} onValueChange={(v) => update({ instrumentType: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">کد ابزار</Label>
              <Input
                className="h-8 text-xs"
                value={config.instrumentCode}
                onChange={(e) => update({ instrumentCode: e.target.value })}
                placeholder="مثلا EX-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">برچسب نمایشی</Label>
              <Input
                className="h-8 text-xs"
                value={config.instrumentLabel}
                onChange={(e) => update({ instrumentLabel: e.target.value })}
                placeholder="مثلا اکستنسومتر شمال"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">سطر هدر (۰-indexed)</Label>
              <Input
                type="number" min={0} className="h-8 text-xs"
                value={config.headerRow}
                onChange={(e) => update({ headerRow: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ستون تاریخ (۰-indexed)</Label>
              <Input
                type="number" min={0} className="h-8 text-xs"
                value={config.dateCol}
                onChange={(e) => update({ dateCol: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">بازه شروع (اختیاری)</Label>
              <Input
                type="date" className="h-8 text-xs"
                value={config.dateRangeStart}
                onChange={(e) => update({ dateRangeStart: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">بازه پایان (اختیاری)</Label>
              <Input
                type="date" className="h-8 text-xs"
                value={config.dateRangeEnd}
                onChange={(e) => update({ dateRangeEnd: e.target.value })}
              />
            </div>
          </div>

          {/* Header row preview */}
          <div className="space-y-1">
            <Label className="text-xs">سطر هدر شناسایی‌شده (برای مرجع):</Label>
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-2 text-xs">
              {analysis.headerCells.slice(0, 25).map((h, i) => (
                <span key={i} className="rounded bg-muted px-1.5 py-0.5">
                  <span className="text-muted-foreground">[{i}]</span> {h || "—"}
                </span>
              ))}
            </div>
          </div>

          {/* Value column picker */}
          <div className="space-y-1">
            <Label className="text-xs">ستون‌های مقدار (انتخاب کنید):</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {analysis.numericCols.map((nc) => (
                <label key={nc.col} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={config.valueCols.some((v) => v.col === nc.col)}
                    onCheckedChange={() => toggleValueCol(nc.col)}
                  />
                  <span className="font-mono">col {nc.col}</span>
                  <span className="text-muted-foreground">{analysis.headerCells[nc.col] || "—"}</span>
                  <span className="ml-auto text-muted-foreground">نمونه: {nc.sample}</span>
                </label>
              ))}
              {analysis.numericCols.length === 0 && (
                <p className="text-xs text-muted-foreground">هیچ ستون عددی شناسایی نشد</p>
              )}
            </div>
          </div>

          {/* Preview data */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">پیش‌نمایش ۵ ردیف اول داده</summary>
            <div className="mt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {analysis.headerCells.slice(0, 15).map((h, i) => (
                      <TableHead key={i} className="text-xs">{h || `col ${i}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: Math.min(15, analysis.headerCells.length) }).map((_, j) => (
                        <TableCell key={j} className="text-xs">
                          {row[j] !== null && row[j] !== undefined ? String(row[j]).slice(0, 20) : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  );
}
