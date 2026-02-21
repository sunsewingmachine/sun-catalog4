/**
 * Catalog cache: read/write products, meta (version, lastUpdated), and features via IndexedDB.
 * Used by version checker to decide whether to re-fetch ItmGroup.
 */

import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import { getCatalogFromDb, setCatalogInDb } from "./indexedDb";

export interface CatalogMeta {
  version: string;
  lastUpdated: string;
}

export async function getCachedCatalog(): Promise<{
  products: Product[];
  meta: CatalogMeta;
  features?: FeatureRecord[];
  rawItmGroupRows?: string[][];
} | null> {
  const raw = await getCatalogFromDb();
  if (!raw || !raw.meta) return null;
  return {
    products: (raw.products as Product[]) ?? [],
    meta: raw.meta,
    features: Array.isArray(raw.features) ? (raw.features as FeatureRecord[]) : undefined,
    rawItmGroupRows: raw.rawItmGroupRows,
  };
}

export async function setCachedCatalog(
  products: Product[],
  version: string,
  features?: FeatureRecord[],
  rawItmGroupRows?: string[][]
): Promise<void> {
  const meta: CatalogMeta = {
    version,
    lastUpdated: new Date().toISOString(),
  };
  await setCatalogInDb(products, meta, features, rawItmGroupRows);
}
