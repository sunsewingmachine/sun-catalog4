"use client";

/**
 * Client wrapper: ensures activated (localStorage), loads catalog (stale-while-revalidate).
 * Shows cached catalog immediately when available; version check and fetch run in parallel;
 * image sync never blocks UI. Price and image mapping use full state only (no partial updates).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { getCachedCatalog, setCachedCatalog } from "@/lib/cacheManager";
import { clearCatalogCache } from "@/lib/indexedDb";
import {
  syncImages,
  getUniqueImageUrlsFromProducts,
  getUniqueFeatureMediaUrls,
  type ImageSyncProgress,
} from "@/lib/imageSyncService";
import { APP_VERSION } from "@/lib/appVersion";

const ACTIVATED_KEY = "catalog_activated";

async function fetchRemoteVersion(): Promise<string> {
  try {
    const res = await fetch("/api/catalog-version");
    if (!res.ok) return "";
    const data = await res.json();
    return (data.version ?? "").toString();
  } catch {
    return "";
  }
}

function applyCatalogState(
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  setFeatures: React.Dispatch<React.SetStateAction<FeatureRecord[]>>,
  setRawItmGroupRows: React.Dispatch<React.SetStateAction<string[][] | undefined>>,
  setDbVersion: React.Dispatch<React.SetStateAction<string>>,
  setLastUpdated: React.Dispatch<React.SetStateAction<string | null>>,
  products: Product[],
  features: FeatureRecord[],
  rawItmGroupRows: string[][] | undefined,
  version: string,
  lastUpdated: string
) {
  setProducts(products);
  setFeatures(features ?? []);
  setRawItmGroupRows(rawItmGroupRows);
  setDbVersion(version);
  setLastUpdated(lastUpdated);
}

/** Runs image sync in background; never blocks. Updates syncProgress for optional UI indicator. */
function runImageSyncInBackground(
  products: Product[],
  features: FeatureRecord[],
  setSyncProgress: React.Dispatch<React.SetStateAction<ImageSyncProgress | null>>,
  cancelledRef: { current: boolean }
) {
  const total =
    getUniqueImageUrlsFromProducts(products).length +
    getUniqueFeatureMediaUrls(features).length;
  setSyncProgress({
    current: 0,
    total,
    message: total > 0 ? "Syncing images…" : "Done",
  });
  syncImages(products, {
    features,
    onProgress: (p) => {
      if (!cancelledRef.current) setSyncProgress(p);
    },
  })
    .finally(() => {
      if (!cancelledRef.current) setSyncProgress(null);
      if (typeof navigator !== "undefined" && navigator.storage?.persist) {
        navigator.storage.persist().catch(() => {});
      }
    });
}

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
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage?.getItem(ACTIVATED_KEY) !== "1") {
      router.replace("/");
      return;
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVATED_KEY);
    }
    router.replace("/");
  }, [router]);

  const handleClearCache = useCallback(async () => {
    await clearCatalogCache();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const handleClearCacheAndLogout = useCallback(async () => {
    await clearCatalogCache();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVATED_KEY);
    }
    router.replace("/");
  }, [router]);

  const performForceRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || "Failed to load catalog");
      }
      const data = await res.json();
      const newProducts = data.products ?? [];
      const newFeatures: FeatureRecord[] = data.features ?? [];
      const allRows: string[][] = data.rawItmGroupRows ?? [];
      const version = (data.version ?? "").toString();
      setProducts(newProducts);
      setFeatures(newFeatures);
      setRawItmGroupRows(allRows);
      setDbVersion(version);
      setLastUpdated(new Date().toISOString());
      await setCachedCatalog(newProducts, version, newFeatures, allRows);
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
    cancelledRef.current = false;
    (async function load() {
      try {
        const [cached, remoteVersion] = await Promise.all([
          getCachedCatalog(),
          fetchRemoteVersion(),
        ]);
        if (cancelledRef.current) return;

        const cachedVersion = cached?.meta?.version ?? null;
        const shouldFetch =
          !cachedVersion ||
          remoteVersion > cachedVersion ||
          remoteVersion !== cachedVersion;

        if (cached) {
          applyCatalogState(
            setProducts,
            setFeatures,
            setRawItmGroupRows,
            setDbVersion,
            setLastUpdated,
            cached.products,
            cached.features ?? [],
            cached.rawItmGroupRows,
            cached.meta.version,
            cached.meta.lastUpdated
          );
          setLoading(false);
          if (typeof navigator !== "undefined" && navigator.storage?.persist) {
            navigator.storage.persist().catch(() => {});
          }
        }

        if (shouldFetch) {
          try {
            const res = await fetch("/api/catalog");
            if (cancelledRef.current) return;
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              if (res.status === 503) {
                setError("Catalog is not configured. Please try again later.");
                if (!cached) setLoading(false);
                return;
              }
              throw new Error((data.error as string) || "Failed to load catalog");
            }
            const data = await res.json();
            const newProducts = data.products ?? [];
            const newFeatures: FeatureRecord[] = data.features ?? [];
            const allRows: string[][] = data.rawItmGroupRows ?? [];
            const version = (data.version ?? "").toString();
            if (cancelledRef.current) return;
            applyCatalogState(
              setProducts,
              setFeatures,
              setRawItmGroupRows,
              setDbVersion,
              setLastUpdated,
              newProducts,
              newFeatures,
              allRows,
              version,
              new Date().toISOString()
            );
            await setCachedCatalog(newProducts, version, newFeatures, allRows);
            if (!cached) setLoading(false);
            if (cancelledRef.current) return;
            runImageSyncInBackground(
              newProducts,
              newFeatures,
              setSyncProgress,
              cancelledRef
            );
          } catch (e) {
            if (!cached) {
              const fallback = await getCachedCatalog();
              if (cancelledRef.current) return;
              if (fallback) {
                applyCatalogState(
                  setProducts,
                  setFeatures,
                  setRawItmGroupRows,
                  setDbVersion,
                  setLastUpdated,
                  fallback.products,
                  fallback.features ?? [],
                  fallback.rawItmGroupRows,
                  fallback.meta.version,
                  fallback.meta.lastUpdated
                );
              } else {
                setError(e instanceof Error ? e.message : "Failed to load catalog");
              }
              setLoading(false);
            }
          }
        } else if (!cached) {
          setError("No cached data. Connect to the internet to load catalog.");
          setLoading(false);
        }
      } catch (e) {
        const fallback = await getCachedCatalog();
        if (cancelledRef.current) return;
        if (fallback) {
          applyCatalogState(
            setProducts,
            setFeatures,
            setRawItmGroupRows,
            setDbVersion,
            setLastUpdated,
            fallback.products,
            fallback.features ?? [],
            fallback.rawItmGroupRows,
            fallback.meta.version,
            fallback.meta.lastUpdated
          );
        } else {
          setError(e instanceof Error ? e.message : "Failed to load catalog");
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelledRef.current = true;
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
    return (
      <div
        id="divCatalogError"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-green-50 p-4"
      >
        <p className="text-center text-red-600">Catalog is temporarily unavailable.</p>
        <p className="text-center text-sm text-slate-500">
          Please check your connection and try again later.
        </p>
      </div>
    );
  }
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("catalog-visible");
  }
  return (
    <CatalogLayout
      products={products}
      features={features}
      rawItmGroupRows={rawItmGroupRows}
      lastUpdated={lastUpdated}
      dbVersion={dbVersion}
      appVersion={APP_VERSION}
      onRequestRefresh={performForceRefresh}
      imageSyncProgress={syncProgress}
      onLogout={handleLogout}
      onClearCache={handleClearCache}
      onClearCacheAndLogout={handleClearCacheAndLogout}
    />
  );
}
