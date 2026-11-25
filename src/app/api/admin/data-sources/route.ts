import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/data-sources - list all data sources
export async function GET() {
  try {
    await requireAdmin();
    const dataSources = await db.dataSource.findMany({
      include: {
        station: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { username: true, displayName: true } },
        _count: { select: { sheets: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json({ dataSources });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
