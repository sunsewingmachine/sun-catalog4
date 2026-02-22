"use client";

/**
 * Client wrapper: ensures activated (localStorage), loads catalog (version check + cache/fetch),
 * syncs images to IndexedDB when catalog changes, renders CatalogLayout.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { shouldFetchCatalogFromApi } from "@/lib/versionChecker";
import { getCachedCatalog, setCachedCatalog } from "@/lib/cacheManager";
import {
  syncImages,
  getUniqueImageUrlsFromProducts,
  getUniqueFeatureMediaUrls,
  type ImageSyncProgress,
} from "@/lib/imageSyncService";
import { APP_VERSION } from "@/lib/appVersion";

const ACTIVATED_KEY = "catalog_activated";

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
    let cancelled = false;
    async function load() {
      try {
        const { shouldFetch } = await shouldFetchCatalogFromApi();
        if (cancelled) return;
        if (shouldFetch) {
          const res = await fetch("/api/catalog");
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (res.status === 503) {
              setError("Catalog is not configured. Please try again later.");
              setLoading(false);
              return;
            }
            throw new Error((data.error as string) || "Failed to load catalog");
          }
          const data = await res.json();
          const newProducts = data.products ?? [];
          const newFeatures: FeatureRecord[] = data.features ?? [];
          const allRows: string[][] = data.rawItmGroupRows ?? [];
          const version = (data.version ?? "").toString();
          if (cancelled) return;
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
        const cached = await getCachedCatalog();
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
      onRequestRefresh={performForceRefresh}
    />
  );
}
