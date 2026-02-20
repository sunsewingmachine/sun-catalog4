/**
 * Catalog cache: read/write products and meta (version, lastUpdated) via IndexedDB.
 * Used by version checker to decide whether to re-fetch ItmGroup.
 */

import type { Product } from "@/types/product";
import { getCatalogFromDb, setCatalogInDb } from "./indexedDb";

export interface CatalogMeta {
  version: string;
  lastUpdated: string;
}

export async function getCachedCatalog(): Promise<{
  products: Product[];
  meta: CatalogMeta;
} | null> {
  const raw = await getCatalogFromDb();
  if (!raw || !raw.meta) return null;
  return {
    products: (raw.products as Product[]) ?? [],
    meta: raw.meta,
  };
}

export async function setCachedCatalog(
  products: Product[],
  version: string
): Promise<void> {
  const meta: CatalogMeta = {
    version,
    lastUpdated: new Date().toISOString(),
  };
  await setCatalogInDb(products, meta);
}
