"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Image as ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface Station { id: string; name: string; code: string; }
interface IncImage {
  id: string;
  stationId: string;
  instrumentCode: string;
  instrumentLabel: string | null;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  updatedAt: string;
  station?: { name: string; code: string };
  uploadedBy?: { displayName: string };
}

export default function InclinometersPage() {
  const { user, loading: authLoading } = useAuth();
  const [stations, setStations] = React.useState<Station[]>([]);
  const [images, setImages] = React.useState<IncImage[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [stationId, setStationId] = React.useState("");
  const [instrumentCode, setInstrumentCode] = React.useState("");
  const [instrumentLabel, setInstrumentLabel] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadStations() {
    const res = await fetch("/api/admin/stations");
    const d = await res.json();
    setStations(d.stations || []);
  }
  async function loadImages() {
    const res = await fetch("/api/admin/inclinometers");
    const d = await res.json();
    setImages(d.images || []);
  }

  React.useEffect(() => {
    if (user?.role === "ADMIN") {
      loadStations();
      loadImages().finally(() => setLoading(false));
    }
  }, [user]);

  async function upload() {
    if (!stationId || !instrumentCode || !file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("stationId", stationId);
      fd.append("instrumentCode", instrumentCode);
      fd.append("instrumentLabel", instrumentLabel);
      const res = await fetch("/api/admin/inclinometers", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "خطا در آپلود");
        return;
      }
      setFile(null); setInstrumentCode(""); setInstrumentLabel("");
      loadImages();
    } finally {
      setUploading(false);
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
            <ImageIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">عکس‌های اینکلاینومتر</h1>
          </div>
          <Link href="/admin"><Button variant="outline" size="sm">بازگشت</Button></Link>
        </div>

        {/* Upload form */}
        <Card className="mb-6">
          <CardHeader><CardTitle>آپلود عکس جدید</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>ایستگاه</Label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger><SelectValue placeholder="انتخاب ایستگاه" /></SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>کد ابزار</Label>
                <Input value={instrumentCode} onChange={(e) => setInstrumentCode(e.target.value)} placeholder="مثلا INC-01" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>برچسب (اختیاری)</Label>
                <Input value={instrumentLabel} onChange={(e) => setInstrumentLabel(e.target.value)} placeholder="مثلا اینکلاینومتر شمال" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>فایل عکس</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
              <p className="text-xs text-muted-foreground">برای هر ترکیب ایستگاه + کد ابزار فقط یک عکس ذخیره می‌شود. آپلود مجدد عکس قبلی را جایگزین می‌کند.</p>
            </div>
            {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}
            <Button onClick={upload} disabled={!stationId || !instrumentCode || !file || uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              آپلود عکس
            </Button>
          </CardContent>
        </Card>

        {/* Existing images */}
        <Card>
          <CardHeader><CardTitle>عکس‌های ذخیره‌شده ({images.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img) => (
                  <Card key={img.id} className="overflow-hidden">
                    <div className="aspect-video w-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.filePath} alt={img.instrumentCode} className="h-full w-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm">{img.instrumentCode}</p>
                      {img.instrumentLabel && <p className="text-xs text-muted-foreground">{img.instrumentLabel}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {img.station?.name} ({img.station?.code})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        بروزرسانی: {new Date(img.updatedAt).toLocaleDateString("fa-IR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {images.length === 0 && (
                  <div className="col-span-full py-8 text-center text-muted-foreground">هنوز عکسی آپلود نشده است</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
