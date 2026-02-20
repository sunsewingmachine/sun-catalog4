/**
 * Product and catalog types for the Product Catalog PWA.
 * Maps sheet columns to product display and category grouping.
 */

export interface Product {
  itmGroupName: string;
  company: string;
  model: string;
  price: string | number;
  warranty: string;
  pCode: string;
  imageFilename: string;
  description?: string;
  category: string;
}

export type Category = string;

export const ALLOWED_CATEGORIES: readonly Category[] = [
  "sv",
  "ta1",
  "ol",
  "31k",
  "zig",
  "fm",
  "pow",
  "tab",
  "stn",
  "motor",
  "gen",
] as const;

export type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

export interface CachedCatalogMeta {
  version: string;
  lastUpdated: string;
}

export interface CachedCatalogData {
  products: Product[];
  meta: CachedCatalogMeta;
}
