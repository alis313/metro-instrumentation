import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import * as XLSX from "xlsx";
import { readFile } from "@/lib/file-storage";
import { analyzeSheet } from "@/lib/excel-configurable";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for parsing large Excel files on Vercel

// GET /api/admin/data-sources/[id]/analyze - returns structural analysis of every sheet in the file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const ds = await db.dataSource.findUnique({ where: { id } });
    if (!ds) {
      return NextResponse.json({ error: "منبع داده یافت نشد" }, { status: 404 });
    }

    // Read file from Vercel Blob (URL) or local filesystem
    const buffer = await readFile(ds.filePath);
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const sheets: ReturnType<typeof analyzeSheet>[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const lower = sheetName.toLowerCase();
      if (lower.startsWith("chart") || /^sheet\d*$/.test(lower)) continue;
      try {
        sheets.push(analyzeSheet(sheet, sheetName));
      } catch (err) {
        console.warn(`[analyze] Failed sheet ${sheetName}:`, err);
      }
    }

    await db.dataSource.update({
      where: { id },
      data: { analyzedAt: new Date() },
    });

    return NextResponse.json({ dataSource: ds, sheets });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    console.error("[admin/data-sources/[id]/analyze] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
