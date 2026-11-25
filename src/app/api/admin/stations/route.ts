import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/stations - list all stations
export async function GET() {
  try {
    await requireAdmin();
    const stations = await db.station.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: {
            dataSources: true,
            inclinometerImages: true,
            userAccess: true,
          },
        },
      },
    });
    return NextResponse.json({ stations });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/stations] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST /api/admin/stations - create a new station
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { name, code } = body as { name?: string; code?: string };

    if (!name || !code) {
      return NextResponse.json(
        { error: "نام ایستگاه و کد اختصاری الزامی است" },
        { status: 400 }
      );
    }

    const existing = await db.station.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "کد ایستگاه تکراری است" }, { status: 400 });
    }

    const station = await db.station.create({
      data: { name: name.trim(), code: code.trim().toUpperCase() },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "CREATE_STATION",
      resourceType: "station",
      resourceId: station.id,
      details: { name: station.name, code: station.code },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/stations] POST error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
