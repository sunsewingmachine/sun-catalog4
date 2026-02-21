/**
 * Exchange price table from raw ItmGroup rows (cache only). Item from ItmGroupName, Price from MRP. Less/Final later.
 * Header row = row 2 (index 1). Data = index 2+.
 */

export interface ExchangePriceRow {
  item: string;
  price: string;
  less: string;
  final: string;
}

/** Sheet row 2 = header (index 1). Data = index 2+. */
const HEADER_ROW_INDEX = 1;
const DATA_START_ROW_INDEX = 2;

/**
 * Normalize for comparison: trim and lowercase so sheet variations (spaces, casing) still match.
 */
function normalizeHeaderCell(cell: string): string {
  return String(cell ?? "").trim().toLowerCase();
}

/** Normalize for flexible match: trim, lowercase, and collapse all whitespace to nothing (so "Final Exchange Price" matches "FinalExchangePrice"). */
function normalizeHeaderCellNoSpaces(cell: string): string {
  return normalizeHeaderCell(cell).replace(/\s+/g, "");
}

/**
 * Find column index in header row where value matches target (case-insensitive, trimmed).
 * Fallback 1: match if cell (with spaces removed) equals target (with spaces removed).
 * Fallback 2: match if cell contains the target (e.g. extra characters in sheet).
 */
function findColumnIndex(headerRow: string[], target: string): number {
  const t = normalizeHeaderCell(target);
  const tNoSpaces = t.replace(/\s+/g, "");
  const idx = headerRow.findIndex((cell) => normalizeHeaderCell(cell) === t);
  if (idx >= 0) return idx;
  const idxNoSpaces = headerRow.findIndex((cell) => normalizeHeaderCellNoSpaces(cell) === tNoSpaces);
  if (idxNoSpaces >= 0) return idxNoSpaces;
  const idxContains = headerRow.findIndex((cell) => {
    const n = normalizeHeaderCellNoSpaces(cell);
    return n.length > 0 && n.includes(tNoSpaces);
  });
  return idxContains >= 0 ? idxContains : -1;
}

/**
 * Log all headers in the row: "columnIndex: headerValue" for each non-empty cell (debug).
 */
function logAllHeadersInRow(rowIndex: number, headerRow: string[]): void {
  if (typeof console === "undefined" || !console.warn) return;
  const entries: string[] = [];
  for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
    const cell = String(headerRow[colIdx] ?? "").trim();
    if (cell) entries.push(colIdx + ": " + cell.slice(0, 80));
  }
  console.warn("[ExchangePrice] Row index", rowIndex, "– all headers:", entries.length ? entries.join(" | ") : "(none)");
}

/**
 * Populate Item (ItmGroupName) and Price (MRP). Less/Final added later.
 */
export function getExchangePriceRows(
  rawItmGroupRows: string[][] | undefined,
  _menuKey: string
): ExchangePriceRow[] {
  if (!rawItmGroupRows || rawItmGroupRows.length === 0) return [];
  if (rawItmGroupRows.length <= HEADER_ROW_INDEX) return [];
  const headerRow = rawItmGroupRows[HEADER_ROW_INDEX] ?? [];
  const colItem = findColumnIndex(headerRow, "ItmGroupName");
  const colMRP = findColumnIndex(headerRow, "MRP");
  const log = typeof console !== "undefined" && console.warn;
  if (log) logAllHeadersInRow(HEADER_ROW_INDEX, headerRow);
  if (colItem < 0 && log) console.warn("[ExchangePrice] ItmGroupName not found in row 2, using column 0");
  const col = colItem >= 0 ? colItem : 0;
  const maxCol = Math.max(col, colMRP >= 0 ? colMRP : 0);
  const rows: ExchangePriceRow[] = [];
  for (let r = DATA_START_ROW_INDEX; r < rawItmGroupRows.length; r++) {
    const rawRow = rawItmGroupRows[r] ?? [];
    const row = rawRow.length > maxCol ? rawRow : [...rawRow, ...Array(maxCol - rawRow.length + 1).fill("")];
    const item = String(row[col] ?? "").trim();
    if (!item) continue;
    const price = colMRP >= 0 ? String(row[colMRP] ?? "").trim() : "";
    rows.push({ item, price, less: "", final: "" });
  }
  if (log) console.warn("[ExchangePrice] populated", rows.length, "rows (Item col", col, "MRP col", colMRP, ")");
  return rows;
}

/**
 * Short label for table header first column (e.g. "Sv C1" from menuKey "C1:Sv").
 */
export function getExchangePriceItemHeaderLabel(menuKey: string): string {
  const parts = menuKey.split(":");
  if (parts.length >= 2) return `${parts[1]} ${parts[0]}`;
  return "Item";
}
