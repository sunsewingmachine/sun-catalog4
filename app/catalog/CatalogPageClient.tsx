"use client";

/**
 * Client wrapper: ensures activated, loads catalog data (version check + cache/fetch), renders CatalogLayout.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { shouldFetchCatalog } from "@/lib/versionChecker";
import { getCachedCatalog, setCachedCatalog } from "@/lib/cacheManager";
import { fetchSheetByGid, getDataRows } from "@/lib/sheetFetcher";
import { mapRowsToProducts } from "@/lib/productMapper";

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

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage?.getItem(ACTIVATED_KEY) !== "1") {
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
        } else {
          const cached = await getCachedCatalog();
          if (cancelled) return;
          if (cached) {
            setProducts(cached.products);
            setLastUpdated(cached.meta.lastUpdated);
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading catalog…</p>
      </div>
    );
  }
  if (error && products.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 p-4">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-zinc-500">You may be offline. Connect and refresh.</p>
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
