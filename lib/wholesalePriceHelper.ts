/**
 * Wholesale prices: read cell values from ItmGroup sheet columns (1-based 39, 42, 46, 49, 53, 56)
 * for the row matching ItmGroupName. Returns formatted string OpPar{val}/OpSet{val}/... for bottom bar.
 */

import { COL_ITM_GROUP_NAME } from "@/lib/exchangePriceColumns";

/** ItmGroup: row 2 = header (index 1). Data rows = index 2+. */
const DATA_START_ROW_INDEX = 2;

/** 0-based column indices for wholesale prices (sheet columns 39, 42, 46, 49, 53, 56). */
const WHOLESALE_COLUMNS: readonly number[] = [38, 41, 45, 48, 52, 55];

const WHOLESALE_LABELS = [
  "OpenDeliveryTop",
  "OpenDeliveryFullSet",
  "NoOpenDeliveryTop",
  "NoOpenDeliveryFullSet",
  "MechTop",
  "MechFullSet",
] as const;

function getRowForItmGroupName(
  rawItmGroupRows: string[][] | undefined,
  itmGroupName: string
): string[] | null {
  if (!rawItmGroupRows || rawItmGroupRows.length <= DATA_START_ROW_INDEX || !itmGroupName.trim())
    return null;
  const keyLower = String(itmGroupName).trim().toLowerCase();
  for (let r = DATA_START_ROW_INDEX; r < rawItmGroupRows.length; r++) {
    const row = rawItmGroupRows[r] ?? [];
    const colA = String(row[COL_ITM_GROUP_NAME] ?? "").trim();
    if (colA.toLowerCase() === keyLower) return row;
  }
  return null;
}

/**
 * Returns formatted string OpenDeliveryTop{val}/OpenDeliveryFullSet{val}/... using values from the given columns for the item row.
 * Empty cells are shown as "—". Returns "" if row not found.
 */
export function getWholesaleStringFromRawRows(
  rawItmGroupRows: string[][] | undefined,
  itmGroupName: string
): string {
  const row = getRowForItmGroupName(rawItmGroupRows, itmGroupName);
  if (!row) return "";
  const parts = WHOLESALE_COLUMNS.map((colIdx, i) => {
    const val = String(row[colIdx] ?? "").trim();
    return `${WHOLESALE_LABELS[i]} ${val || "—"}`;
  });
  return parts.join("/");
}

/**
 * Same as getWholesaleStringFromRawRows but with newlines for 3-line display:
 * Line 1: OpenDeliveryTop/OpenDeliveryFullSet, Line 2: NoOpenDeliveryTop/NoOpenDeliveryFullSet, Line 3: MechTop/MechFullSet.
 */
export function getWholesaleStringThreeLines(
  rawItmGroupRows: string[][] | undefined,
  itmGroupName: string
): string {
  const row = getRowForItmGroupName(rawItmGroupRows, itmGroupName);
  if (!row) return "";
  const parts = WHOLESALE_COLUMNS.map((colIdx, i) => {
    const val = String(row[colIdx] ?? "").trim();
    return `${WHOLESALE_LABELS[i]} ${val || "—"}`;
  });
  if (parts.length < 6) return parts.join("/");
  return [parts[0], parts[1]].join("/") + "\n"
    + [parts[2], parts[3]].join("/") + "\n"
    + [parts[4], parts[5]].join("/");
}
