import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SheetConfigInput {
  sheetName: string;
  enabled: boolean;
  instrumentType: "EXTENSOMETER" | "CRACKMETER" | "TILTMETER" | "OBSERVATION_WELL" | "INCLINOMETER" | "OTHER";
  instrumentCode?: string | null;
  instrumentLabel?: string | null;
  headerRow: number;
  dateCol: number;
  valueCols: Array<{ col: number; label: string; color?: string }>;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
}

// PUT /api/admin/data-sources/[id]/configure - replace the set of SheetConfig rows
export async function PUT(
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

    const body = await req.json();
    const { sheets } = body as { sheets?: SheetConfigInput[] };

    if (!Array.isArray(sheets)) {
      return NextResponse.json({ error: "ورودی sheets نامعتبر است" }, { status: 400 });
    }

    // Replace existing sheet configs in a transaction
    await db.$transaction(async (tx) => {
      await tx.sheetConfig.deleteMany({ where: { dataSourceId: id } });
      for (const s of sheets) {
        if (!s.sheetName) continue;
        await tx.sheetConfig.create({
          data: {
            dataSourceId: id,
            sheetName: s.sheetName,
            enabled: !!s.enabled,
            instrumentType: s.instrumentType || "OTHER",
            instrumentCode: s.instrumentCode || null,
            instrumentLabel: s.instrumentLabel || null,
            headerRow: s.headerRow ?? 0,
            dateCol: s.dateCol ?? 1,
            valueCols: JSON.stringify(s.valueCols || []),
            dateRangeStart: s.dateRangeStart || null,
            dateRangeEnd: s.dateRangeEnd || null,
          },
        });
      }
      await tx.dataSource.update({
        where: { id },
        data: { status: "CONFIGURED" },
      });
    });

    const forwarded = req.headers.get("x-forwarded-for");
    await logActivity({
      userId: session.userId,
      username: session.username,
      action: "CONFIGURE_DATA_SOURCE",
      resourceType: "dataSource",
      resourceId: id,
      details: {
        sheetCount: sheets.length,
        enabledCount: sheets.filter((s) => s.enabled).length,
      },
      ip: forwarded ? forwarded.split(",")[0].trim() : "unknown",
    });

    return NextResponse.json({ ok: true, configuredSheets: sheets.length });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/[id]/configure] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
