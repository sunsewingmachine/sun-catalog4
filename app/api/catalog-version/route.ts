/**
 * API route: returns current catalog version from the db sheet (B1).
 * Used by the client for cache invalidation without exposing sheet ID.
 */

import { NextResponse } from "next/server";
import { getServerSheetConfig, isCatalogConfigured } from "@/lib/serverSheetConfig";
import { fetchDbVersion } from "@/lib/dbVersionFetcher";

export async function GET() {
  try {
    const config = getServerSheetConfig();
    if (!isCatalogConfigured(config)) {
      return NextResponse.json(
        { error: "Not configured." },
        { status: 503 }
      );
    }
    const version = await fetchDbVersion(config.sheetId, config.dbGid);
    return NextResponse.json({ version });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get version";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
