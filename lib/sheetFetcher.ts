/**
 * Fetches a Google Sheet tab by gid and parses the gviz JSONP response into table rows.
 * Call getDataRows(table, 1) to skip one header row; use 2 if sheet has empty row 1 then header.
 */

const GVIZ_JSONP_REGEX = /google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/;

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
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Sheet not found (404).");
    }
    throw new Error(`Sheet fetch failed: ${res.status}`);
  }
  const text = await res.text();
  const jsonStr = extractJsonFromGvizJsonp(text);
  const data = JSON.parse(jsonStr) as GvizResponse;
  if (!data?.table) throw new Error("Missing table in gviz response");
  return data.table;
}

/**
 * Return all table rows as string[][] (including header rows). Row index 0 = first sheet row, 1 = second (e.g. header row 2 with exchange column names).
 */
export function getAllRows(table: GvizTable): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row?.c) continue;
    rows.push(row.c.map((cell) => getCellValue(cell)));
  }
  return rows;
}

/**
 * Return data rows as array of column arrays. Skips rows before dataStartRowIndex (typically 1 = header only).
 * Use 1 when sheet has one header row then data (or when gviz omits empty row 1 so index 0 = header).
 * Use 2 when sheet has row 1 empty, row 2 header, row 3+ data.
 */
export function getDataRows(table: GvizTable, dataStartRowIndex: number = 1): string[][] {
  const rows: string[][] = [];
  for (let i = dataStartRowIndex; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row?.c) continue;
    const values = row.c.map((cell) => getCellValue(cell));
    rows.push(values);
  }
  return rows;
}
