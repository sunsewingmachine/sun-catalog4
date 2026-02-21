/**
 * Maps Features sheet rows to FeatureRecord. Col A = key, Col B = label, Col C = url.
 * Used to resolve product EY segments to display text and optional media (image/video).
 */

import type { FeatureRecord } from "@/types/feature";

const COL_A = 0;
const COL_B = 1;
const COL_C = 2;

export function mapRowsToFeatureRecords(rows: string[][]): FeatureRecord[] {
  const out: FeatureRecord[] = [];
  for (const row of rows) {
    const key = String(row[COL_A] ?? "").trim();
    const label = String(row[COL_B] ?? "").trim();
    const url = String(row[COL_C] ?? "").trim() || undefined;
    if (key) out.push({ key, label, url });
  }
  return out;
}
