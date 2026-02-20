/**
 * Fetches the db sheet and returns the version value from cell B1 (first row, second column).
 * Sheet db: A1 = "ver", B1 = version value.
 */

import { fetchSheetByGid, getCellValue } from "./sheetFetcher";

export async function fetchDbVersion(sheetId: string, dbGid: string): Promise<string> {
  const table = await fetchSheetByGid(sheetId, dbGid);
  if (!table.rows?.length || !table.rows[0]?.c) return "";
  const row0 = table.rows[0].c;
  const b1 = row0[1];
  return getCellValue(b1 ?? null);
}
