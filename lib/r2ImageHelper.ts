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
