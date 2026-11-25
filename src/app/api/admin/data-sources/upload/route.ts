import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { saveFile } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

// POST /api/admin/data-sources/upload
// Multipart form: file (the .xls/.xlsx), stationId
// The server uploads to Vercel Blob (production) or local filesystem (dev)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    const stationId = formData.get("stationId") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "فایل ارسال نشده است" }, { status: 400 });
    }
    if (!stationId) {
      return NextResponse.json({ error: "ایستگاه مشخص نشده است" }, { status: 400 });
    }

    const station = await db.station.findUnique({ where: { id: stationId } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob (production) or local filesystem (dev)
    const stored = await saveFile(buffer, file.name, "data-sources", station.code);

    const dataSource = await db.dataSource.create({
      data: {
        stationId,
        fileName: file.name,
        filePath: stored.path,
        fileSize: stored.size,
        uploadedById: session.userId,
        status: "PENDING",
      },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "UPLOAD_DATA_SOURCE",
      resourceType: "dataSource",
      resourceId: dataSource.id,
      details: { fileName: file.name, stationCode: station.code },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ dataSource }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/upload] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای سرور" },
      { status: 500 }
    );
  }
}
