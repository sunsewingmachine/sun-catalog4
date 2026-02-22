/**
 * Central app settings: in-file variables you can edit here, and env-derived config
 * (env values are read from .env.local; do not put secrets in this file).
 */

import { parseSheetId, parseGid } from "./sheetEnvParser";

/** In-file variables — edit these directly to change behavior without touching .env */
export const SETTINGS = {
  /** Catalog window/title label in the UI */
  catalogTitle: "Catalog",
  /** First data row in the ItmGroup sheet (0 = use all; 1 = skip first row). Overridden by NEXT_PUBLIC_ITMGROUP_DATA_START_ROW when set. */
  dataStartRowDefault: 0,
  /** First data row in the Features sheet (usually 1 after header) */
  featuresDataStartRow: 1,
  /** Whether to show app version in the UI */
  showAppVersion: true,
  /** LocalStorage key used for activation state */
  activationStorageKey: "catalog_activated",
  /** Messages shown one-by-one in the bottom bar (5s interval, smooth animation). Add more as needed. */
  displayMessages: [
    "We are No.1 in Tamilnadu",
    "We have 8 branches all over Tamilnadu",
    "We are serving Since 1988 (38 years)",
    "We have 100+ products",
    "We are serving 50000+ customers",
    "We have 38+ years of experience",
  ],
  /** Interval (ms) between switching to the next message in the bottom bar. */
  bottomBarMessageIntervalMs: 5000,
  /** Fallback image when product/bar image is missing, wrong format, or fails to load (public/machines/Sample.jpg). */
  fallbackImagePath: "/machines/Sample.jpg",
} as const;

/** Env-derived config (set in .env.local; restart dev server after changes) */
function getEnv(key: string, fallback = ""): string {
  if (typeof process === "undefined") return fallback;
  return (process.env[key] ?? fallback).trim();
}

function getEnvNumber(key: string, fallback: number): number {
  const raw = getEnv(key, String(fallback));
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, n);
}

export const ENV = {
  sheetId: parseSheetId(getEnv("NEXT_PUBLIC_SHEET_ID")),
  itmGroupGid: parseGid(getEnv("NEXT_PUBLIC_ITMGROUP_GID")),
  dbGid: parseGid(getEnv("NEXT_PUBLIC_DB_GID")),
  featuresGid: parseGid(getEnv("NEXT_PUBLIC_FEATURES_GID")),
  /** GID of the Ultra price sheet; column A is listed in the Ultra price exchange box. */
  ultraGid: parseGid(getEnv("NEXT_PUBLIC_ULTRA_GID")),
  dataStartRow: getEnvNumber("NEXT_PUBLIC_ITMGROUP_DATA_START_ROW", SETTINGS.dataStartRowDefault),
  cdnBaseUrl: getEnv("NEXT_PUBLIC_CDN_BASE_URL"),
  cdnImagePrefix: getEnv("NEXT_PUBLIC_CDN_IMAGE_PREFIX"),
  cdnBarPathPrefix: getEnv("NEXT_PUBLIC_CDN_BAR_PATH_PREFIX"),
  /** If set, feature media (col C) use this base URL instead of CDN_BASE_URL (e.g. when videos are in a different R2 bucket). */
  cdnFeaturesBaseUrl: getEnv("NEXT_PUBLIC_CDN_FEATURES_BASE_URL"),
} as const;
