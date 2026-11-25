import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { saveFile } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

// GET /api/admin/inclinometers - list all inclinometer images
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const stationId = searchParams.get("stationId");

    const where = stationId ? { stationId } : {};
    const images = await db.inclinometerImage.findMany({
      where,
      include: {
        station: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { username: true, displayName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ images });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/inclinometers] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST /api/admin/inclinometers - upload an inclinometer image
// Multipart form: file, stationId, instrumentCode, instrumentLabel?
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    const stationId = formData.get("stationId") as string | null;
    const instrumentCode = formData.get("instrumentCode") as string | null;
    const instrumentLabel = formData.get("instrumentLabel") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "فایل ارسال نشده است" }, { status: 400 });
    }
    if (!stationId || !instrumentCode) {
      return NextResponse.json(
        { error: "ایستگاه و کد ابزار الزامی است" },
        { status: 400 }
      );
    }

    const station = await db.station.findUnique({ where: { id: stationId } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to Vercel Blob (production) or local filesystem (dev)
    const stored = await saveFile(buffer, file.name, "inclinometers", station.code);

    // Upsert: one image per (stationId, instrumentCode)
    const image = await db.inclinometerImage.upsert({
      where: {
        stationId_instrumentCode: { stationId, instrumentCode },
      },
      update: {
        fileName: file.name,
        filePath: stored.publicPath, // URL (Vercel Blob) or /inclinometers/xxx.png (dev)
        instrumentLabel: instrumentLabel || null,
        uploadedById: session.userId,
        updatedAt: new Date(),
      },
      create: {
        stationId,
        instrumentCode,
        instrumentLabel: instrumentLabel || null,
        fileName: file.name,
        filePath: stored.publicPath,
        uploadedById: session.userId,
      },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "UPLOAD_INCLINOMETER_IMAGE",
      resourceType: "inclinometerImage",
      resourceId: image.id,
      details: { stationCode: station.code, instrumentCode, fileName: file.name },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/inclinometers] POST error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
