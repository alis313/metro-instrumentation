import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      stations: user.stationAccess.map((a) => ({
        id: a.station.id,
        name: a.station.name,
        code: a.station.code,
      })),
    },
  });
}
