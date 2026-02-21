/**
 * Ultra price: lookup MRP (col S) from main ItmGroup by ItmGroupName (col A).
 * Used to show main item MRP and sum of parts (cols B,C,D) MRP in the Ultra box.
 */

import { COL_ITM_GROUP_NAME, COL_MRP } from "@/lib/exchangePriceColumns";

/** ItmGroup: row 2 = header (index 1). Data rows = index 2+. */
const DATA_START_ROW_INDEX = 2;

function parseNum(val: string | number): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Find MRP (column S, 0-based index 18) for the row where column A matches name.
 * Returns 0 if not found or name is empty.
 */
export function getMrpByItmGroupName(
  rawItmGroupRows: string[][] | undefined,
  name: string
): number {
  if (!rawItmGroupRows || rawItmGroupRows.length <= DATA_START_ROW_INDEX) return 0;
  const key = String(name ?? "").trim();
  if (!key) return 0;
  const keyLower = key.toLowerCase();
  for (let r = DATA_START_ROW_INDEX; r < rawItmGroupRows.length; r++) {
    const row = rawItmGroupRows[r] ?? [];
    const colA = String(row[COL_ITM_GROUP_NAME] ?? "").trim();
    if (colA.toLowerCase() === keyLower) {
      const mrp = row[COL_MRP] ?? "";
      return parseNum(mrp);
    }
  }
  return 0;
}

/** One Ultra row: col A (main item), cols B,C,D (part items). LineGap in col A starts a new group. */
export type UltraRow = [colA: string, colB: string, colC: string, colD: string];

/** Computed prices for display: main item MRP and sum of B+C+D MRPs. */
export interface UltraRowWithPrices {
  colA: string;
  colB: string;
  colC: string;
  colD: string;
  mainMrp: number;
  partsTotalMrp: number;
}

export function getUltraRowWithPrices(
  row: UltraRow,
  rawItmGroupRows: string[][] | undefined
): UltraRowWithPrices {
  const [colA, colB, colC, colD] = row;
  const mainMrp = getMrpByItmGroupName(rawItmGroupRows, colA);
  const partsTotalMrp =
    getMrpByItmGroupName(rawItmGroupRows, colB) +
    getMrpByItmGroupName(rawItmGroupRows, colC) +
    getMrpByItmGroupName(rawItmGroupRows, colD);
  return { colA, colB, colC, colD, mainMrp, partsTotalMrp };
}
