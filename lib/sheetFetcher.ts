/**
 * Fetches a Google Sheet tab by gid and parses the gviz JSONP response into table rows.
 * Sheet structure: row 1 empty, row 2 headers, row 3+ data. Data rows start at table.rows[2].
 */

const GVIZ_JSONP_REGEX = /google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s;

export interface GvizCell {
  v?: string | number | boolean | null;
  f?: string;
}

export interface GvizRow {
  c: (GvizCell | null)[];
}

export interface GvizTable {
  cols: { id: string; label: string; type: string }[];
  rows: GvizRow[];
}

export interface GvizResponse {
  table: GvizTable;
}

function extractJsonFromGvizJsonp(text: string): string {
  const match = text.match(GVIZ_JSONP_REGEX);
  if (!match || !match[1]) throw new Error("Invalid gviz JSONP response");
  return match[1].trim();
}

export function getCellValue(cell: GvizCell | null): string {
  if (!cell || cell.v == null) return "";
  if (typeof cell.v === "string") return cell.v;
  if (typeof cell.v === "number") return String(cell.v);
  return String(cell.v);
}

/**
 * Fetch sheet as gviz JSON and return parsed table. Throws on network or parse errors.
 */
export async function fetchSheetByGid(
  sheetId: string,
  gid: string
): Promise<GvizTable> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const text = await res.text();
  const jsonStr = extractJsonFromGvizJsonp(text);
  const data = JSON.parse(jsonStr) as GvizResponse;
  if (!data?.table) throw new Error("Missing table in gviz response");
  return data.table;
}

/**
 * Return data rows as array of column arrays. Row 0 = sheet row 1, row 1 = sheet row 2, row 2 = sheet row 3 (first data row).
 * So data rows start at index 2.
 */
export function getDataRows(table: GvizTable, dataStartRowIndex: number = 2): string[][] {
  const rows: string[][] = [];
  for (let i = dataStartRowIndex; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row?.c) continue;
    const values = row.c.map((cell) => getCellValue(cell));
    rows.push(values);
  }
  return rows;
}
