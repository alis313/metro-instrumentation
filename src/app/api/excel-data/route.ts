import { NextResponse } from "next/server";
import { getAllExcelData, getExcelData } from "@/lib/excel-reader";

export const dynamic = "force-static";

// Returns Excel data for ALL stations keyed by stationId, plus a top-level
// `stations` array listing which stations have real data.
export async function GET() {
  const allData = getAllExcelData();
  const stationIds = Object.keys(allData);

  if (stationIds.length === 0) {
    // Fallback: try legacy single-station loader for backward compat
    const legacy = getExcelData();
    if (!legacy) {
      return NextResponse.json(
        { error: "Excel data not available", stations: {} },
        { status: 200 }
      );
    }
    return NextResponse.json({
      stations: { [legacy.stationId]: legacy },
    });
  }

  return NextResponse.json({
    stations: allData,
  });
}
