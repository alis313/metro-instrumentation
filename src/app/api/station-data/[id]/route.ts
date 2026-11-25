import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, canUserAccessStation } from "@/lib/auth";
import { getConfiguredStationData } from "@/lib/excel-configurable";

export const dynamic = "force-dynamic";

// GET /api/station-data/[id] - returns configured instrument data for a station
// Accessible to admins (any station) and viewers (only their assigned stations)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }
    const { id } = await params;

    const station = await db.station.findUnique({ where: { id } });
    if (!station) {
      return NextResponse.json({ error: "ایستگاه یافت نشد" }, { status: 404 });
    }

    const allowed = await canUserAccessStation(session, id);
    if (!allowed) {
      return NextResponse.json({ error: "به این ایستگاه دسترسی ندارید" }, { status: 403 });
    }

    const data = await getConfiguredStationData(id);

    // Log the view action
    const forwarded = req.headers.get("x-forwarded-for");
    await db.activityLog.create({
      data: {
        userId: session.userId,
        username: session.username,
        action: "VIEW_STATION",
        resourceType: "station",
        resourceId: id,
        details: JSON.stringify({ stationCode: station.code }),
        ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
        userAgent: req.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
        layoutImagePath: station.layoutImagePath,
        layoutImageUploadedAt: station.layoutImageUploadedAt,
      },
      ...data,
    });
  } catch (err) {
    console.error("[station-data] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
