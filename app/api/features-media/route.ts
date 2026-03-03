/**
 * API route: returns Features sheet rows (cols A, B, C) and existing R2 filenames
 * in CatelogPicturesVideos/ folder. Used by the admin "Manage features" section.
 */

import { NextResponse } from "next/server";
import { getServerSheetConfig } from "@/lib/serverSheetConfig";
import { fetchSheetByGid, getDataRows } from "@/lib/sheetFetcher";
import { listKeysByPrefix } from "@/lib/r2ListHelper";
import type { FeatureAdminRow, FeaturesMediaResponse } from "@/types/featureAdmin";

/** R2 key prefix for feature media. Matches getCdnFeaturesPrefix() default. */
function getFeatureMediaR2Prefix(): string {
  const explicit = process.env.NEXT_PUBLIC_CDN_FEATURES_PREFIX?.trim();
  return explicit || "CatelogPicturesVideos";
}

export async function GET(): Promise<NextResponse<FeaturesMediaResponse | { error: string }>> {
  try {
    const config = getServerSheetConfig();
    if (!config.sheetId || !config.featuresGid) {
      return NextResponse.json({ error: "Features sheet not configured" }, { status: 503 });
    }

    const table = await fetchSheetByGid(config.sheetId, config.featuresGid);
    const rawRows = getDataRows(table, config.featuresDataStartRow);

    const rows: FeatureAdminRow[] = rawRows
      .map((row, index) => ({
        rowNumber: config.featuresDataStartRow + 1 + index,
        key: row[0] ?? "",
        label: row[1] ?? "",
        mediaFilename: row[2] ?? "",
      }))
      .filter((r) => r.key || r.label);

    const r2Prefix = getFeatureMediaR2Prefix();
    const r2Files = await listKeysByPrefix(r2Prefix);

    return NextResponse.json({ rows, r2Files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
