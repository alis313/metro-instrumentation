import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// POST /api/seed - one-time endpoint to seed the database with admin user + default stations.
// Protected by JWT_SECRET query param. DELETE this file after first use in production.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Unauthorized - provide ?secret=YOUR_JWT_SECRET" }, { status: 403 });
  }

  try {
    const adminPassword = await hashPassword("admin123");
    const admin = await db.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        id: "admin-001",
        username: "admin",
        passwordHash: adminPassword,
        displayName: "مدیر سامانه",
        role: "ADMIN",
      },
    });

    const stations = [
      { id: "st-link", name: "سه راهی", code: "Link" },
      { id: "st-n3", name: "ایستگاه شهدا", code: "N3" },
      { id: "st-o3", name: "ایستگاه شارستان", code: "O3" },
      { id: "st-p3", name: "ایستگاه باب الجواد", code: "P3" },
      { id: "st-q3", name: "ایستگاه دانش", code: "Q3" },
      { id: "st-r3", name: "ایستگاه بسیج", code: "R3" },
    ];
    for (const s of stations) {
      await db.station.upsert({
        where: { code: s.code },
        update: { name: s.name },
        create: s,
      });
    }

    return NextResponse.json({
      ok: true,
      admin: admin.username,
      stationsCreated: stations.length,
      message: "Seed complete. Login with admin / admin123. DELETE /api/seed/route.ts now.",
    });
  } catch (err) {
    console.error("[seed] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
