import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users - list all users
export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { stationAccess: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST /api/admin/users - create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { username, password, displayName, role, stationIds } = body as {
      username?: string;
      password?: string;
      displayName?: string;
      role?: "ADMIN" | "VIEWER";
      stationIds?: string[];
    };

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: "نام کاربری، رمز عبور و نام نمایشی الزامی است" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: "نام کاربری تکراری است" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        displayName: displayName.trim(),
        role: role === "ADMIN" ? "ADMIN" : "VIEWER",
        stationAccess: role === "ADMIN"
          ? undefined
          : {
              create: (stationIds || []).map((stationId) => ({ stationId })),
            },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "CREATE_USER",
      resourceType: "user",
      resourceId: user.id,
      details: { username: user.username, role: user.role },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users] POST error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
