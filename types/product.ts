/**
 * Product and catalog types for the Product Catalog PWA.
 * Maps sheet columns to product display and category grouping.
 */

/** Wholesale prices by item type (Partial/Set) and delivery (Open/Fitting, Packing, Mech). Shown when "W/s price" is on. */
export interface WholesalePrices {
  /** Partial, Open/Fitting */
  opPar: number;
  /** Set, Open/Fitting */
  opSet: number;
  /** Partial, Packing */
  packPar: number;
  /** Set, Packing */
  packSet: number;
  /** Partial, Mech */
  mechPar: number;
  /** Set, Mech */
  mechSet: number;
}

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
  /** Optional order number from sheet column AF; used for section-3 list (1, 2, 3, ...). */
  af?: number;
  /** Optional feature keys from sheet column EY; split by "::" e.g. "Gen.Perfect threading:: Sv.Happy Stitch". */
  ey?: string;
  /** Optional wholesale prices; when set and "W/s price" is on, shown above bottom bar. */
  wholesale?: WholesalePrices;
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
