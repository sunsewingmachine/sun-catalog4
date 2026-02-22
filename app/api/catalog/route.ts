/**
 * API route: returns full catalog (products, version, features, rawItmGroupRows) by fetching
 * the Google Sheet on the server. Sheet ID and GIDs are never sent to the client.
 */

import { NextResponse } from "next/server";
import { getServerSheetConfig, isCatalogConfigured } from "@/lib/serverSheetConfig";
import { fetchSheetByGid, getDataRows, getAllRows } from "@/lib/sheetFetcher";
import { fetchDbVersion } from "@/lib/dbVersionFetcher";
import { mapRowsToProducts } from "@/lib/productMapper";
import { mapRowsToFeatureRecords } from "@/lib/featuresMapper";

export async function GET() {
  try {
    const config = getServerSheetConfig();
    if (!isCatalogConfigured(config)) {
      return NextResponse.json(
        { error: "Catalog is not configured." },
        { status: 503 }
      );
    }
    const table = await fetchSheetByGid(config.sheetId, config.itmGroupGid);
    const rows = getDataRows(table, config.dataStartRow);
    const allRows = getAllRows(table);
    const products = mapRowsToProducts(rows);
    const version = await fetchDbVersion(config.sheetId, config.dbGid);
    let features: { key: string; label: string }[] = [];
    if (config.featuresGid) {
      try {
        const featuresTable = await fetchSheetByGid(config.sheetId, config.featuresGid);
        const featuresRows = getDataRows(featuresTable, config.featuresDataStartRow);
        features = mapRowsToFeatureRecords(featuresRows);
      } catch {
        // optional
      }
    }
    return NextResponse.json({
      products,
      version,
      features,
      rawItmGroupRows: allRows,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load catalog";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
