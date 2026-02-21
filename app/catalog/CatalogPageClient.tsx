"use client";

/**
 * Client wrapper: ensures activated (localStorage), loads catalog (version check + cache/fetch),
 * syncs images to IndexedDB when catalog changes, renders CatalogLayout.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { shouldFetchCatalog } from "@/lib/versionChecker";
import { getCachedCatalog, setCachedCatalog } from "@/lib/cacheManager";
import { fetchSheetByGid, getDataRows, getAllRows } from "@/lib/sheetFetcher";
import { mapRowsToProducts } from "@/lib/productMapper";
import { mapRowsToFeatureRecords } from "@/lib/featuresMapper";
import type { FeatureRecord } from "@/types/feature";
import {
  syncImages,
  getUniqueImageUrlsFromProducts,
  getUniqueFeatureMediaUrls,
  type ImageSyncProgress,
} from "@/lib/imageSyncService";
import { APP_VERSION } from "@/lib/appVersion";

const ACTIVATED_KEY = "catalog_activated";

const SHEET_ID =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SHEET_ID ?? "")
    : "";
const ITMGROUP_GID =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_ITMGROUP_GID ?? "")
    : "";
const DB_GID =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_DB_GID ?? "")
    : "";
const FEATURES_GID =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_FEATURES_GID ?? "")
    : "";
const ULTRA_GID =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_ULTRA_GID ?? "")
    : "";
/** Rows to skip before data. 0 = use all rows (mapper skips empty/header/LineGap); 1 = skip first row. API often omits empty row so row 0 = 1stMdm. */
const DATA_START_ROW =
  typeof process !== "undefined"
    ? Math.max(0, parseInt(process.env.NEXT_PUBLIC_ITMGROUP_DATA_START_ROW ?? "0", 10))
    : 0;

/** Features sheet typically has one header row then data. */
const FEATURES_DATA_START_ROW = 1;

export default function CatalogPageClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [features, setFeatures] = useState<FeatureRecord[]>([]);
  const [rawItmGroupRows, setRawItmGroupRows] = useState<string[][] | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dbVersion, setDbVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<ImageSyncProgress | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage?.getItem(ACTIVATED_KEY) !== "1") {
      router.replace("/");
      return;
    }
  }, [router]);

  const performForceRefresh = useCallback(async () => {
    if (!SHEET_ID || !ITMGROUP_GID || !DB_GID) return;
    setLoading(true);
    setError(null);
    try {
      const table = await fetchSheetByGid(SHEET_ID, ITMGROUP_GID);
      const rows = getDataRows(table, DATA_START_ROW);
      const allRows = getAllRows(table);
      console.warn("[ExchangePrice] Refresh: table.rows.length =", table.rows?.length, "allRows.length =", allRows?.length, "allRows[1]?.length (header cols) =", allRows?.[1]?.length);
      const newProducts = mapRowsToProducts(rows);
      const version = await (await import("@/lib/dbVersionFetcher")).fetchDbVersion(
        SHEET_ID,
        DB_GID
      );
      let newFeatures: FeatureRecord[] = [];
      if (SHEET_ID && FEATURES_GID) {
        try {
          const featuresTable = await fetchSheetByGid(SHEET_ID, FEATURES_GID);
          const featuresRows = getDataRows(featuresTable, FEATURES_DATA_START_ROW);
          newFeatures = mapRowsToFeatureRecords(featuresRows);
        } catch {
          // Features sheet optional; continue without
        }
      }
      setProducts(newProducts);
      setFeatures(newFeatures);
      setRawItmGroupRows(allRows);
      console.warn("[ExchangePrice] Refresh: setRawItmGroupRows(allRows) called, allRows.length =", allRows.length);
      setDbVersion(version);
      setLastUpdated(new Date().toISOString());
      await setCachedCatalog(newProducts, version, newFeatures, allRows);
      console.warn("[ExchangePrice] Refresh: setCachedCatalog done");
      const imageCount = getUniqueImageUrlsFromProducts(newProducts).length;
      const featureMediaCount = getUniqueFeatureMediaUrls(newFeatures).length;
      const totalSync = imageCount + featureMediaCount;
      setSyncProgress({
        current: 0,
        total: totalSync,
        message: totalSync > 0 ? "Syncing images…" : "Done",
      });
      try {
        await syncImages(newProducts, {
          features: newFeatures,
          onProgress: (p) => setSyncProgress(p),
        });
      } finally {
        setSyncProgress(null);
        if (typeof navigator !== "undefined" && navigator.storage?.persist) {
          navigator.storage.persist().catch(() => {});
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!SHEET_ID || !ITMGROUP_GID || !DB_GID) {
        setError("Missing sheet configuration. Set NEXT_PUBLIC_SHEET_ID, NEXT_PUBLIC_ITMGROUP_GID, NEXT_PUBLIC_DB_GID.");
        setLoading(false);
        return;
      }
      try {
        const { shouldFetch } = await shouldFetchCatalog(SHEET_ID, DB_GID);
        if (cancelled) return;
        if (shouldFetch) {
          const table = await fetchSheetByGid(SHEET_ID, ITMGROUP_GID);
          const rows = getDataRows(table, DATA_START_ROW);
          const allRows = getAllRows(table);
          const newProducts = mapRowsToProducts(rows);
          const version = await (await import("@/lib/dbVersionFetcher")).fetchDbVersion(
            SHEET_ID,
            DB_GID
          );
          let newFeatures: FeatureRecord[] = [];
          if (SHEET_ID && FEATURES_GID) {
            try {
              const featuresTable = await fetchSheetByGid(SHEET_ID, FEATURES_GID);
              const featuresRows = getDataRows(featuresTable, FEATURES_DATA_START_ROW);
              newFeatures = mapRowsToFeatureRecords(featuresRows);
            } catch {
              // Features sheet optional
            }
          }
          if (cancelled) return;
          console.warn("[ExchangePrice] Load (shouldFetch): allRows.length =", allRows?.length);
          setProducts(newProducts);
          setFeatures(newFeatures);
          setRawItmGroupRows(allRows);
          setDbVersion(version);
          setLastUpdated(new Date().toISOString());
          await setCachedCatalog(newProducts, version, newFeatures, allRows);
          if (cancelled) return;
          const imageCount = getUniqueImageUrlsFromProducts(newProducts).length;
          const featureMediaCount = getUniqueFeatureMediaUrls(newFeatures).length;
          const totalSync = imageCount + featureMediaCount;
          setSyncProgress({
            current: 0,
            total: totalSync,
            message: totalSync > 0 ? "Syncing images…" : "Done",
          });
          try {
            await syncImages(newProducts, {
              features: newFeatures,
              onProgress: (p) => {
                if (!cancelled) setSyncProgress(p);
              },
            });
          } finally {
            if (!cancelled) setSyncProgress(null);
            if (typeof navigator !== "undefined" && navigator.storage?.persist) {
              navigator.storage.persist().catch(() => {});
            }
          }
        } else {
          const cached = await getCachedCatalog();
          if (cancelled) return;
          console.warn("[ExchangePrice] Load from cache: cached.rawItmGroupRows =", cached?.rawItmGroupRows == null ? "null/undefined" : `array length ${(cached?.rawItmGroupRows as string[][])?.length}`);
          if (cached) {
            setProducts(cached.products);
            setFeatures(cached.features ?? []);
            setRawItmGroupRows(cached.rawItmGroupRows);
            setDbVersion(cached.meta.version);
            setLastUpdated(cached.meta.lastUpdated);
            if (typeof navigator !== "undefined" && navigator.storage?.persist) {
              navigator.storage.persist().catch(() => {});
            }
          } else {
            setError("No cached data. Connect to the internet to load catalog.");
          }
        }
      } catch (e) {
        console.warn("[ExchangePrice] Load error, fallback to cache:", e);
        const cached = await getCachedCatalog();
        console.warn("[ExchangePrice] Fallback cache: rawItmGroupRows =", cached?.rawItmGroupRows == null ? "null/undefined" : `length ${(cached?.rawItmGroupRows as string[][])?.length}`);
        if (cached) {
          setProducts(cached.products);
          setFeatures(cached.features ?? []);
          setRawItmGroupRows(cached.rawItmGroupRows);
          setDbVersion(cached.meta.version);
          setLastUpdated(cached.meta.lastUpdated);
        } else {
          setError(e instanceof Error ? e.message : "Failed to load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);


  if (loading) {
    return (
      <div id="divCatalogLoading" className="flex min-h-screen items-center justify-center bg-green-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-teal-600" aria-hidden />
          <p className="text-slate-500">Loading catalog…</p>
          {syncProgress && (
            <p id="pImageSyncProgress" className="text-sm text-teal-600">
              {syncProgress.total > 0
                ? (syncProgress.message ?? `Syncing images ${syncProgress.current}/${syncProgress.total}`)
                : syncProgress.message}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (error && products.length === 0) {
    const is404 = error.includes("404") || error.includes("not found");
    const itemsSheetUrl =
      SHEET_ID && ITMGROUP_GID
        ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${ITMGROUP_GID}`
        : null;
    return (
      <div
        id="divCatalogError"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-green-50 p-4"
      >
        <p className="text-center text-red-600">{error}</p>
        <p className="text-center text-sm text-slate-500">
          {is404
            ? "Fix the sheet URL or sharing, then refresh."
            : "You may be offline. Connect and refresh."}
        </p>
        {(SHEET_ID || ITMGROUP_GID || DB_GID) && (
          <div
            id="divCatalogErrorDiagnostics"
            className="mt-4 w-full max-w-md rounded-2xl border border-green-200 bg-white p-4 text-left text-xs text-slate-600 shadow-sm"
          >
            <p className="mb-1 font-medium text-slate-700">Config in use:</p>
            <p>NEXT_PUBLIC_SHEET_ID = {SHEET_ID || "(empty)"}</p>
            <p>NEXT_PUBLIC_ITMGROUP_GID = {ITMGROUP_GID || "(empty)"}</p>
            <p>NEXT_PUBLIC_DB_GID = {DB_GID || "(empty)"}</p>
            <p className="mt-2 text-slate-500">
              Sheet ID is the part in your spreadsheet URL: …/d/<strong>[this]</strong>/edit
            </p>
            <p className="text-slate-500">
              GID is in the tab URL when you click a sheet tab: …#gid=<strong>[number]</strong>
            </p>
            {itemsSheetUrl && (
              <p className="mt-2">
                <a
                  href={itemsSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 underline hover:text-teal-700"
                >
                  Open items sheet URL in a new tab
                </a>{" "}
                — if it 404s there too, the ID or GID is wrong or that tab isn’t published.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[ExchangePrice] CatalogPageClient render: rawItmGroupRows =", rawItmGroupRows == null ? "undefined" : `array length ${rawItmGroupRows.length}`);
  }
  return (
    <CatalogLayout
      products={products}
      features={features}
      rawItmGroupRows={rawItmGroupRows}
      lastUpdated={lastUpdated}
      dbVersion={dbVersion}
      appVersion={APP_VERSION}
      sheetId={SHEET_ID}
      ultraGid={ULTRA_GID}
      onRequestRefresh={performForceRefresh}
    />
  );
}
