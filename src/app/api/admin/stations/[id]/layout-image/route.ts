import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { saveFile } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

// POST /api/admin/stations/[id]/layout-image
// Multipart form: file (the image)
// The server uploads to Vercel Blob (or local filesystem in dev) and stores the URL
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const station = await db.station.findUnique({ where: { id } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "فایل تصویر ارسال نشده است" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob (production) or local filesystem (dev)
    const stored = await saveFile(buffer, file.name, "station-layouts", station.code);

    const updated = await db.station.update({
      where: { id },
      data: {
        layoutImagePath: stored.publicPath,
        layoutImageUploadedAt: new Date(),
      },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "UPLOAD_STATION_LAYOUT",
      resourceType: "station",
      resourceId: id,
      details: { stationCode: station.code, imageUrl: stored.publicPath, fileName: file.name },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ station: updated, imageUrl: stored.publicPath });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/stations/[id]/layout-image] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای سرور" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/stations/[id]/layout-image - remove the layout image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const station = await db.station.findUnique({ where: { id } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    await db.station.update({
      where: { id },
      data: {
        layoutImagePath: null,
        layoutImageUploadedAt: null,
      },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "DELETE_STATION_LAYOUT",
      resourceType: "station",
      resourceId: id,
      details: { stationCode: station.code },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/stations/[id]/layout-image] DELETE error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
