/**
 * API route: returns Ultra price sheet rows (column A list for the Ultra box).
 * Sheet ID and GID stay on server so the client cannot open the sheet.
 */

import { NextResponse } from "next/server";
import { getServerSheetConfig } from "@/lib/serverSheetConfig";
import { fetchSheetByGid, getAllRows } from "@/lib/sheetFetcher";
import type { UltraRow } from "@/lib/ultraPriceHelper";

export async function GET() {
  try {
    const config = getServerSheetConfig();
    if (!config.sheetId || !config.ultraGid) {
      return NextResponse.json(
        { error: "Ultra price not configured." },
        { status: 503 }
      );
    }
    const table = await fetchSheetByGid(config.sheetId, config.ultraGid);
    const allRows = getAllRows(table);
    const rows: UltraRow[] = allRows.map((row) => [
      String((row[0] ?? "")).trim(),
      String((row[1] ?? "")).trim(),
      String((row[2] ?? "")).trim(),
      String((row[3] ?? "")).trim(),
    ] as UltraRow);
    return NextResponse.json({ rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Ultra price";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
