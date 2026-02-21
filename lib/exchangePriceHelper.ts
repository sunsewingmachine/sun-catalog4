/**
 * Exchange price table from raw ItmGroup rows (cache only). Item, MRP, Less (menuKey:FinalExchangePrice), Final = MRP − Less.
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

/** Known column positions when header text is missing or different: Col A = item names, Col S = MRP. */
const COL_A_INDEX = 0;
const COL_S_INDEX = 18;

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
 * Fallback 3: match if cell with non-word chars removed equals target with same (e.g. "M.R.P." -> "mrp").
 */
function findColumnIndex(headerRow: string[], target: string): number {
  const t = normalizeHeaderCell(target);
  const tNoSpaces = t.replace(/\s+/g, "");
  const tAlpha = t.replace(/\W/g, "");
  const idx = headerRow.findIndex((cell) => normalizeHeaderCell(cell) === t);
  if (idx >= 0) return idx;
  const idxNoSpaces = headerRow.findIndex((cell) => normalizeHeaderCellNoSpaces(cell) === tNoSpaces);
  if (idxNoSpaces >= 0) return idxNoSpaces;
  const idxContains = headerRow.findIndex((cell) => {
    const n = normalizeHeaderCellNoSpaces(cell);
    return n.length > 0 && n.includes(tNoSpaces);
  });
  if (idxContains >= 0) return idxContains;
  if (tAlpha.length > 0) {
    const idxAlpha = headerRow.findIndex((cell) => {
      const c = normalizeHeaderCell(cell).replace(/\W/g, "");
      return c === tAlpha;
    });
    if (idxAlpha >= 0) return idxAlpha;
  }
  return -1;
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

function parseNum(val: string): number {
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Populate Item, MRP, Less (menuKey:FinalExchangePrice), Final = MRP − Less.
 */
export function getExchangePriceRows(
  rawItmGroupRows: string[][] | undefined,
  menuKey: string
): ExchangePriceRow[] {
  if (!rawItmGroupRows || rawItmGroupRows.length === 0) return [];
  if (rawItmGroupRows.length <= HEADER_ROW_INDEX) return [];
  const headerRow = rawItmGroupRows[HEADER_ROW_INDEX] ?? [];
  // Item names: from column A (index 0). Prefer header "ItmGroupName" if present.
  const colItem = findColumnIndex(headerRow, "ItmGroupName");
  const col = colItem >= 0 ? colItem : COL_A_INDEX;
  // MRP: from column S (index 18). Prefer header "MRP" if present.
  const colMRPFound = findColumnIndex(headerRow, "MRP");
  const colMRP = colMRPFound >= 0 ? colMRPFound : COL_S_INDEX;
  const targetLess = `${menuKey}:FinalExchangePrice`;
  const colLess = findColumnIndex(headerRow, targetLess);
  const log = typeof console !== "undefined" && console.warn;
  if (log) logAllHeadersInRow(HEADER_ROW_INDEX, headerRow);
  if (log && colItem < 0) console.warn("[ExchangePrice] ItmGroupName not in header, using column A (index 0) for names");
  if (log && colMRPFound < 0) console.warn("[ExchangePrice] MRP not in header, using column S (index 18) for MRP");
  const maxCol = Math.max(col, colMRP, colLess >= 0 ? colLess : 0);
  const rows: ExchangePriceRow[] = [];
  for (let r = DATA_START_ROW_INDEX; r < rawItmGroupRows.length; r++) {
    const rawRow = rawItmGroupRows[r] ?? [];
    const row = rawRow.length > maxCol ? rawRow : [...rawRow, ...Array(maxCol - rawRow.length + 1).fill("")];
    const item = String(row[col] ?? "").trim();
    if (!item) continue;
    const price = String(row[colMRP] ?? "").trim();
    const lessVal = colLess >= 0 ? String(row[colLess] ?? "").trim() : "";
    const mrpNum = parseNum(price);
    const lessNum = parseNum(lessVal);
    const finalNum = mrpNum - lessNum;
    rows.push({
      item,
      price,
      less: lessVal,
      final: lessVal ? String(Math.round(finalNum)) : "",
    });
  }
  if (log) console.warn("[ExchangePrice] populated", rows.length, "rows (Item", col, "MRP", colMRP, "Less", colLess, ")");
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
