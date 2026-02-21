"use client";

/**
 * Client wrapper: ensures activated (localStorage), loads catalog (version check + cache/fetch),
 * syncs images to IndexedDB when catalog changes, renders CatalogLayout.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { shouldFetchCatalog } from "@/lib/versionChecker";
import { getCachedCatalog, setCachedCatalog } from "@/lib/cacheManager";
import { fetchSheetByGid, getDataRows } from "@/lib/sheetFetcher";
import { mapRowsToProducts } from "@/lib/productMapper";
import {
  syncImages,
  getUniqueImageUrlsFromProducts,
  type ImageSyncProgress,
} from "@/lib/imageSyncService";

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

export default function CatalogPageClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<ImageSyncProgress | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage?.getItem(ACTIVATED_KEY) !== "1") {
      router.replace("/");
      return;
    }
  }, [router]);

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
          const rows = getDataRows(table, 2);
          const newProducts = mapRowsToProducts(rows);
          const version = await (await import("@/lib/dbVersionFetcher")).fetchDbVersion(
            SHEET_ID,
            DB_GID
          );
          await setCachedCatalog(newProducts, version);
          if (cancelled) return;
          setProducts(newProducts);
          setLastUpdated(new Date().toISOString());
          const imageCount = getUniqueImageUrlsFromProducts(newProducts).length;
          setSyncProgress({
            current: 0,
            total: imageCount,
            message: imageCount > 0 ? "Syncing images…" : "Done",
          });
          try {
            await syncImages(newProducts, {
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
          if (cached) {
            setProducts(cached.products);
            setLastUpdated(cached.meta.lastUpdated);
            if (typeof navigator !== "undefined" && navigator.storage?.persist) {
              navigator.storage.persist().catch(() => {});
            }
          } else {
            setError("No cached data. Connect to the internet to load catalog.");
          }
        }
      } catch (e) {
        const cached = await getCachedCatalog();
        if (cached) {
          setProducts(cached.products);
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
  return (
    <CatalogLayout
      products={products}
      lastUpdated={lastUpdated}
    />
  );
}
