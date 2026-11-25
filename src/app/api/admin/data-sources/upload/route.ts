import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { saveFile } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

// POST /api/admin/data-sources/upload
// Two modes:
// 1. JSON body { stationId, blobUrl, fileName, fileSize } - client already uploaded to Vercel Blob
// 2. Multipart form { file, stationId } - fallback for dev mode (local filesystem)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const contentType = req.headers.get("content-type") || "";

    let stationId: string;
    let fileName: string;
    let fileSize: number;
    let filePath: string;

    if (contentType.includes("application/json")) {
      // Mode 1: client-side upload already done, just store the metadata
      const body = await req.json();
      stationId = body.stationId;
      fileName = body.fileName;
      fileSize = body.fileSize || 0;
      filePath = body.blobUrl; // URL from Vercel Blob

      if (!stationId || !filePath || !fileName) {
        return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
      }
    } else {
      // Mode 2: multipart form (dev fallback)
      const formData = await req.formData();
      const file = formData.get("file");
      stationId = formData.get("stationId") as string;

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "فایل ارسال نشده است" }, { status: 400 });
      }
      if (!stationId) {
        return NextResponse.json({ error: "ایستگاه مشخص نشده است" }, { status: 400 });
      }

      fileName = file.name;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileSize = buffer.length;

      const stored = await saveFile(buffer, fileName, "data-sources", "DEV");
      filePath = stored.path;
    }

    const station = await db.station.findUnique({ where: { id: stationId } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    const dataSource = await db.dataSource.create({
      data: {
        stationId,
        fileName,
        filePath,
        fileSize,
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
      details: { fileName, stationCode: station.code },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ dataSource }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/upload] POST error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
