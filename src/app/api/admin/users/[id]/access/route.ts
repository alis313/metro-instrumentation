import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PUT /api/admin/users/[id]/access - replace the set of stations a viewer can access
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { stationIds } = body as { stationIds?: string[] };

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Admins implicitly have access to all stations - no per-station rows needed
    if (user.role === "ADMIN") {
      // Still clear any existing rows (they're redundant for admins)
      await db.userStationAccess.deleteMany({ where: { userId: id } });
      return NextResponse.json({ ok: true, stationIds: [] });
    }

    const ids = Array.isArray(stationIds) ? stationIds : [];

    // Delete existing access not in the new list
    await db.userStationAccess.deleteMany({ where: { userId: id } });

    // Insert new access rows (we already deleted existing ones above, so no duplicates)
    if (ids.length > 0) {
      await db.userStationAccess.createMany({
        data: ids.map((stationId: string) => ({ userId: id, stationId })),
      });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "UPDATE_USER_ACCESS",
      resourceType: "user",
      resourceId: id,
      details: { stationIds: ids },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ ok: true, stationIds: ids });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users/[id]/access] PUT error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
