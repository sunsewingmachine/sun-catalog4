/**
 * Server-only sheet config: use from API routes so sheet ID and GIDs never reach the client.
 * Prefers SHEET_ID / ITMGROUP_GID / etc. (no NEXT_PUBLIC_), then falls back to NEXT_PUBLIC_*.
 */

import { parseSheetId, parseGid } from "./sheetEnvParser";

function getEnv(key: string): string {
  if (typeof process === "undefined") return "";
  return (process.env[key] ?? "").trim();
}

export interface ServerSheetConfig {
  sheetId: string;
  itmGroupGid: string;
  dbGid: string;
  featuresGid: string;
  ultraGid: string;
  dataStartRow: number;
  featuresDataStartRow: number;
}

export function getServerSheetConfig(): ServerSheetConfig {
  const sheetId = parseSheetId(getEnv("SHEET_ID") || getEnv("NEXT_PUBLIC_SHEET_ID"));
  const itmGroupGid = parseGid(getEnv("ITMGROUP_GID") || getEnv("NEXT_PUBLIC_ITMGROUP_GID"));
  const dbGid = parseGid(getEnv("DB_GID") || getEnv("NEXT_PUBLIC_DB_GID"));
  const featuresGid = parseGid(getEnv("FEATURES_GID") || getEnv("NEXT_PUBLIC_FEATURES_GID"));
  const ultraGid = parseGid(getEnv("ULTRA_GID") || getEnv("NEXT_PUBLIC_ULTRA_GID"));
  const dataStartRow = Math.max(
    0,
    parseInt(getEnv("ITMGROUP_DATA_START_ROW") || getEnv("NEXT_PUBLIC_ITMGROUP_DATA_START_ROW") || "0", 10)
  );
  const featuresDataStartRow = 1;
  return {
    sheetId,
    itmGroupGid,
    dbGid,
    featuresGid,
    ultraGid,
    dataStartRow,
    featuresDataStartRow,
  };
}

export function isCatalogConfigured(config: ServerSheetConfig): boolean {
  return Boolean(config.sheetId && config.itmGroupGid && config.dbGid);
}
