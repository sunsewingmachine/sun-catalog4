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

export function mapRowToProduct(row: string[], rowIndex: number): Product | null {
  const colA = String(row[COL_A] ?? "").trim();
  if (!colA || colA.toLowerCase() === "linegap") return null;

  const category = getCategoryFromItmGroupName(colA);
  if (!isAllowedCategory(category)) return null;

  const { company, model } = segmentsFromColA(colA);
  const price = row[COL_S] ?? "";
  const warranty = String(row[COL_T] ?? "").trim();
  const pCode = buildPCode(row, rowIndex);
  const imageFilename = `${colA} (1).jpg`;

  return {
    itmGroupName: colA,
    company,
    model,
    price,
    warranty,
    pCode,
    imageFilename,
    category,
  };
}

export function mapRowsToProducts(rows: string[][]): Product[] {
  const products: Product[] = [];
  rows.forEach((row, i) => {
    const p = mapRowToProduct(row, i);
    if (p) products.push(p);
  });
  return products;
}
