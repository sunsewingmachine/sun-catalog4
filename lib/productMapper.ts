/**
 * Maps raw sheet rows (array of column values) to Product objects.
 * Col A=0, R=17, S=18, T=19. Skip rows where A is empty or "LineGap".
 * PCode: D + (S-R) + 1 random digit + P + R + 1 random digit (deterministic per row).
 */

import type { Product } from "@/types/product";
import { getCategoryFromItmGroupName, isAllowedCategory } from "./categoryParser";

const COL_A = 0;
const COL_R = 17;
const COL_S = 18;
const COL_T = 19;
/** Column AF = 0-based index 31 (A=0, …, Z=25, AA=26, …, AF=31). */
const COL_AF = 31;
/** Column EY = 0-based index 128 (E=4, Y=24 → 4*26+24=128). */
const COL_EY = 128;

function parseNum(val: string | number): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = Number(String(val).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function deterministicDigit(seed: string, index: number): number {
  let h = 0;
  const s = seed + String(index);
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  return (h % 10 + 10) % 10;
}

function buildPCode(row: string[], rowIndex: number): string {
  const r = parseNum(row[COL_R] ?? 0);
  const s = parseNum(row[COL_S] ?? 0);
  const discount = Math.max(0, s - r);
  const seed = (row[COL_A] ?? "") + String(rowIndex);
  const d1 = deterministicDigit(seed, 0);
  const d2 = deterministicDigit(seed, 1);
  return `D${discount}${d1}P${r}${d2}`;
}

function segmentsFromColA(colA: string): { company: string; model: string } {
  const parts = String(colA ?? "").trim().split(".");
  const company = parts[1] ?? "";
  const model = parts[2] ?? "";
  return { company, model };
}

/** Header value for column A; skip this row so it is never treated as a product. */
const HEADER_COL_A = "itmgroupname";

export function mapRowToProduct(row: string[], rowIndex: number): Product | null {
  const colA = String(row[COL_A] ?? "").trim();
  if (!colA || colA.toLowerCase() === "linegap" || colA.toLowerCase() === HEADER_COL_A) return null;

  const category = getCategoryFromItmGroupName(colA);
  if (!isAllowedCategory(category)) return null;

  const { company, model } = segmentsFromColA(colA);
  const price = row[COL_S] ?? "";
  const warranty = String(row[COL_T] ?? "").trim();
  const pCode = buildPCode(row, rowIndex);
  /** Main image: same as list name + .jpg (no "(1)" suffix). */
  const imageFilename = `${colA}.jpg`;
  const afRaw = row[COL_AF];
  const af = parseNum(afRaw);
  const afNum = af > 0 && Number.isInteger(af) ? af : undefined;
  const eyRaw = String(row[COL_EY] ?? "").trim();
  const ey = eyRaw || undefined;

  return {
    itmGroupName: colA,
    company,
    model,
    price,
    warranty,
    pCode,
    imageFilename,
    category,
    ...(afNum !== undefined && { af: afNum }),
    ...(ey !== undefined && { ey }),
  };
}

/**
 * Fill down empty column A from the previous row (handles merged cells in Sheets that return empty for subsequent rows).
 * Mutates rows in place; only fills when current A is empty and previous A is non-empty.
 */
export function fillDownColumnA(rows: string[][]): string[][] {
  for (let i = 1; i < rows.length; i++) {
    const prevA = rows[i - 1]?.[COL_A];
    const curA = rows[i]?.[COL_A];
    const prevVal = String(prevA ?? "").trim();
    const curVal = String(curA ?? "").trim();
    if (curVal === "" && prevVal !== "") {
      rows[i] = [...(rows[i] ?? [])];
      rows[i][COL_A] = prevA ?? "";
    }
  }
  return rows;
}

export function mapRowsToProducts(rows: string[][]): Product[] {
  const filled = fillDownColumnA(rows.map((r) => [...r]));
  const products: Product[] = [];
  filled.forEach((row, i) => {
    const p = mapRowToProduct(row, i);
    if (p) products.push(p);
  });
  return products;
}
