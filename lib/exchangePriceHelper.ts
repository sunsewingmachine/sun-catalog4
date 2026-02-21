/**
 * Exchange price table from raw ItmGroup rows (cache only). Uses fixed column indices from exchangePriceColumns.
 * Item = col 1, MRP = col 19, Less = menu’s FinalExchangePrice column, Final = MRP − Less.
 */

import {
  COL_ITM_GROUP_NAME,
  COL_MRP,
  COL_FINAL_EXCHANGE_PRICE_BY_MENU,
} from "@/lib/exchangePriceColumns";

export interface ExchangePriceRow {
  item: string;
  price: string;
  less: string;
  final: string;
}

/** Sheet row 2 = header (index 1). Data = index 2+. */
const HEADER_ROW_INDEX = 1;
const DATA_START_ROW_INDEX = 2;

function parseNum(val: string): number {
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Populate Item, MRP, Less (from menu’s FinalExchangePrice column), Final = MRP − Less.
 * Column indices from exchangePriceColumns (user-provided sheet layout).
 */
export function getExchangePriceRows(
  rawItmGroupRows: string[][] | undefined,
  menuKey: string
): ExchangePriceRow[] {
  if (!rawItmGroupRows || rawItmGroupRows.length === 0) return [];
  if (rawItmGroupRows.length <= HEADER_ROW_INDEX) return [];
  const col = COL_ITM_GROUP_NAME;
  const colMRP = COL_MRP;
  const colLess = COL_FINAL_EXCHANGE_PRICE_BY_MENU[menuKey] ?? -1;
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
