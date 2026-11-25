import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "LOGOUT",
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
