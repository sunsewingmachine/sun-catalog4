/**
 * Maps Features sheet rows to FeatureRecord. Col A = key, Col B = label.
 * Used to resolve product EY segments to display text.
 */

import type { FeatureRecord } from "@/types/feature";

const COL_A = 0;
const COL_B = 1;

export function mapRowsToFeatureRecords(rows: string[][]): FeatureRecord[] {
  const out: FeatureRecord[] = [];
  for (const row of rows) {
    const key = String(row[COL_A] ?? "").trim();
    const label = String(row[COL_B] ?? "").trim();
    if (key) out.push({ key, label });
  }
  return out;
}
