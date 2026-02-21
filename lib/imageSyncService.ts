/**
 * Syncs catalog images and feature media to IndexedDB: full download on first run, then only when server is newer (Last-Modified).
 */

import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import { getImageUrl, getFeatureMediaUrl } from "./r2ImageHelper";
import { getCachedLastModified, setCachedImage } from "./imageCacheManager";

const CONCURRENCY = 5;

export interface ImageSyncProgress {
  current: number;
  total: number;
  message?: string;
}

/** Returns unique image URLs from products (only CDN http URLs). */
export function getUniqueImageUrlsFromProducts(
  products: Product[]
): string[] {
  const seen = new Set<string>();
  for (const p of products) {
    if (!p?.imageFilename) continue;
    const url = getImageUrl(p.imageFilename, false);
    if (url.startsWith("http") && !seen.has(url)) seen.add(url);
    const urlLower = getImageUrl(p.imageFilename, true);
    if (urlLower.startsWith("http") && urlLower !== url && !seen.has(urlLower))
      seen.add(urlLower);
  }
  return Array.from(seen);
}

/** Returns unique feature media URLs (col C) as full CDN URLs for sync. */
export function getUniqueFeatureMediaUrls(features: FeatureRecord[]): string[] {
  const seen = new Set<string>();
  for (const f of features ?? []) {
    if (!f?.url?.trim()) continue;
    const url = getFeatureMediaUrl(f.url);
    if (url.startsWith("http") && !seen.has(url)) seen.add(url);
  }
  return Array.from(seen);
}

function parseLastModified(header: string | null): number {
  if (!header) return 0;
  const t = Date.parse(header);
  return Number.isNaN(t) ? 0 : t;
}

/** HEAD request to get Last-Modified. Returns null if missing or request fails. */
export async function fetchImageLastModified(
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { method: "HEAD" });
    const lm = res.headers.get("last-modified");
    return lm;
  } catch {
    return null;
  }
}

/** GET image, then cache blob and Last-Modified. */
export async function downloadAndCacheImage(
  imageUrl: string
): Promise<void> {
  const res = await fetch(imageUrl, { referrerPolicy: "no-referrer" });
  if (!res.ok) return;
  const blob = await res.blob();
  const lastModified =
    res.headers.get("last-modified") || new Date().toISOString();
  await setCachedImage(imageUrl, lastModified, blob);
}

function shouldDownloadImage(
  localLastModified: string | null,
  serverLastModified: string | null
): boolean {
  if (!localLastModified) return true;
  if (!serverLastModified) return false;
  const localMs = parseLastModified(localLastModified);
  const serverMs = parseLastModified(serverLastModified);
  return serverMs > localMs;
}

async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  let index = 0;
  const total = items.length;

  async function worker(): Promise<void> {
    while (index < total) {
      const i = index++;
      await fn(items[i]);
      onProgress?.(index, total);
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, total) },
    () => worker()
  );
  await Promise.all(workers);
}

/**
 * Syncs catalog images and optional feature media: for each URL, compare server Last-Modified with local;
 * download only if missing or server is newer. Runs with limited concurrency.
 */
export async function syncImages(
  products: Product[],
  options?: {
    features?: FeatureRecord[];
    onProgress?: (progress: ImageSyncProgress) => void;
  }
): Promise<void> {
  const productUrls = getUniqueImageUrlsFromProducts(products);
  const featureUrls = options?.features ? getUniqueFeatureMediaUrls(options.features) : [];
  const urls = [...productUrls];
  for (const u of featureUrls) {
    if (!urls.includes(u)) urls.push(u);
  }
  if (urls.length === 0) {
    options?.onProgress?.({ current: 0, total: 0, message: "No images to sync" });
    return;
  }

  options?.onProgress?.({
    current: 0,
    total: urls.length,
    message: "Checking images…",
  });

  await runWithConcurrency(
    urls,
    async (imageUrl) => {
      const local = await getCachedLastModified(imageUrl);
      const server = await fetchImageLastModified(imageUrl);
      if (shouldDownloadImage(local, server))
        await downloadAndCacheImage(imageUrl);
    },
    (current, total) => {
      options?.onProgress?.({
        current,
        total,
        message: `Syncing images ${current}/${total}`,
      });
    }
  );

  options?.onProgress?.({
    current: urls.length,
    total: urls.length,
    message: "Done",
  });
}
