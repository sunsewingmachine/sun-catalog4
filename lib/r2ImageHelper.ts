/**
 * Builds full image URL from CDN base and product image filename (e.g. ItmGroupName.jpg for main image).
 * NEXT_PUBLIC_CDN_BASE_URL is inlined at build time; restart dev server after changing .env.local.
 */

/** Exported for diagnostics; use getImageUrl() for building URLs. */
export function getCdnBase(): string {
  if (typeof process === "undefined") return "";
  const url = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  if (!url || typeof url !== "string") return "";
  return url.replace(/\/$/, "");
}

/** Optional path prefix in bucket (e.g. "items"). Set NEXT_PUBLIC_CDN_IMAGE_PREFIX in .env.local; restart dev server after change. */
export function getCdnImagePrefix(): string {
  if (typeof process === "undefined") return "";
  const p = process.env.NEXT_PUBLIC_CDN_IMAGE_PREFIX;
  if (!p || typeof p !== "string") return "";
  return p.replace(/\/$/, "").replace(/^\//, "");
}

/** Default bucket path for feature media (col C). Must match R2 public URL (no sun-catalog-assets/ in path). Override with NEXT_PUBLIC_CDN_FEATURES_PREFIX. */
const DEFAULT_FEATURES_PREFIX = "CatelogPicturesVideos";

/** Base URL for feature media. If NEXT_PUBLIC_CDN_FEATURES_BASE_URL is set, use it (different bucket); else same as product images. */
function getCdnFeaturesBase(): string {
  if (typeof process === "undefined") return "";
  const u = process.env.NEXT_PUBLIC_CDN_FEATURES_BASE_URL;
  if (u && typeof u === "string") return u.replace(/\/$/, "");
  return getCdnBase();
}

/** Path prefix for feature media (images/videos). Uses NEXT_PUBLIC_CDN_FEATURES_PREFIX if set, else CatelogPicturesVideos. */
function getCdnFeaturesPrefix(): string {
  if (typeof process === "undefined") return "";
  const p = process.env.NEXT_PUBLIC_CDN_FEATURES_PREFIX;
  if (p && typeof p === "string") return p.replace(/\/$/, "").replace(/^\//, "");
  return DEFAULT_FEATURES_PREFIX;
}

/** Builds full CDN URL for feature media (col C): image or video filename in bucket. Fetched and cached like product images. */
export function getFeatureMediaUrl(filename: string): string {
  if (!filename || !filename.trim()) return "";
  const base = getCdnFeaturesBase();
  if (!base) return "";
  const prefix = getCdnFeaturesPrefix();
  const path = prefix ? `${prefix}/${encodeURIComponent(filename.trim())}` : encodeURIComponent(filename.trim());
  return `${base}/${path}`;
}

/** useLowercase: when true, returns URL with lowercase filename (for fallback after exact-case 404). R2 keys are case-sensitive. */
export function getImageUrl(imageFilename: string, useLowercase = false): string {
  if (!imageFilename) return "";
  const base = getCdnBase();
  if (!base) return `/images/${encodeURIComponent(imageFilename)}`;
  const prefix = getCdnImagePrefix();
  const filenameForPath = useLowercase ? imageFilename.toLowerCase() : imageFilename;
  const path = prefix ? `${prefix}/${encodeURIComponent(filenameForPath)}` : encodeURIComponent(filenameForPath);
  return `${base}/${path}`;
}

/** Server folder name for the bottom bar: ForAll (shared) or ForGroup (category-prefixed). */
export type BarImageFolder = "ForAll" | "ForGroup";

/** Path prefix where items/ForAll/ForGroup live. Same logic as r2ListHelper (explicit or parent of items prefix). */
function getBarImagesPathPrefix(): string {
  if (typeof process === "undefined") return "";
  const explicit = process.env.NEXT_PUBLIC_CDN_BAR_PATH_PREFIX;
  if (explicit && typeof explicit === "string") {
    return explicit.replace(/\/$/, "").replace(/^\//, "");
  }
  const itemsPrefix = process.env.NEXT_PUBLIC_CDN_IMAGE_PREFIX;
  if (!itemsPrefix || typeof itemsPrefix !== "string") return "";
  const parts = itemsPrefix.replace(/^\//, "").replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length < 2) return "";
  return parts.slice(0, -1).join("/");
}

/** Builds CDN URL for an image in ForAll or ForGroup server folder. Path: base/[pathPrefix/]folder/filename (same path as items). */
export function getImageUrlForFolder(
  imageFilename: string,
  folder: BarImageFolder
): string {
  if (!imageFilename) return "";
  const base = getCdnBase();
  if (!base) return `/images/${folder}/${encodeURIComponent(imageFilename)}`;
  const pathPrefix = getBarImagesPathPrefix();
  const path = pathPrefix
    ? `${pathPrefix}/${folder}/${encodeURIComponent(imageFilename)}`
    : `${folder}/${encodeURIComponent(imageFilename)}`;
  return `${base}/${path}`;
}
