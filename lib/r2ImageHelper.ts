/**
 * Builds full image URL from CDN base and product image filename (e.g. ItmGroupName (1).jpg).
 */

const CDN_BASE =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CDN_BASE_URL
    ? process.env.NEXT_PUBLIC_CDN_BASE_URL.replace(/\/$/, "")
    : "";

export function getImageUrl(imageFilename: string): string {
  if (!imageFilename) return "";
  const base = CDN_BASE || "";
  if (!base) return `/images/${encodeURIComponent(imageFilename)}`;
  return `${base}/${encodeURIComponent(imageFilename)}`;
}
