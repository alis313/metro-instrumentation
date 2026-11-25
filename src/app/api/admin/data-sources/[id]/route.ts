import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";
import { deleteFile } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

// GET /api/admin/data-sources/[id] - get one data source with its sheet configs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ds = await db.dataSource.findUnique({
      where: { id },
      include: {
        station: true,
        uploadedBy: { select: { username: true, displayName: true } },
        sheets: { orderBy: { sheetName: "asc" } },
      },
    });
    if (!ds) {
      return NextResponse.json({ error: "منبع داده یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ dataSource: ds });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/[id]] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// DELETE /api/admin/data-sources/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const ds = await db.dataSource.findUnique({ where: { id } });
    if (!ds) {
      return NextResponse.json({ error: "منبع داده یافت نشد" }, { status: 404 });
    }
    // Delete from Vercel Blob or local filesystem
    await deleteFile(ds.filePath);
    await db.dataSource.delete({ where: { id } });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "DELETE_DATA_SOURCE",
      resourceType: "dataSource",
      resourceId: id,
      details: { fileName: ds.fileName },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/[id]] DELETE error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
