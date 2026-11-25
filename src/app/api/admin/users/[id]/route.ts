import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users/[id] - get a single user with station access
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        stationAccess: {
          include: {
            station: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users/[id]] GET error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - update user (displayName, role, optional password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { displayName, role, password } = body as {
      displayName?: string;
      role?: "ADMIN" | "VIEWER";
      password?: string;
    };

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (displayName) data.displayName = displayName.trim();
    if (role) data.role = role === "ADMIN" ? "ADMIN" : "VIEWER";
    if (password && password.length >= 4) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await db.user.update({ where: { id }, data, select: {
      id: true, username: true, displayName: true, role: true,
    }});

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "EDIT_USER",
      resourceType: "user",
      resourceId: id,
      details: { updated: Object.keys(data) },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users/[id]] PATCH error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    if (id === session.userId) {
      return NextResponse.json({ error: "نمی‌توانید حساب خودتان را حذف کنید" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }
    await db.user.delete({ where: { id } });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "DELETE_USER",
      resourceType: "user",
      resourceId: id,
      details: { deletedUsername: existing.username },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/users/[id]] DELETE error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
