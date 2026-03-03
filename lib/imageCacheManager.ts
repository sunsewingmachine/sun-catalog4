/**
 * Image cache: store blobs keyed by URL with lastModified for sync. Resolve display URL from cache or network.
 */

import { openDb } from "./indexedDb";

const STORE = "imageCache";

export interface CachedImageEntry {
  blob: Blob;
  lastModified: string;
}

export async function getCachedImageEntry(
  imageUrl: string
): Promise<CachedImageEntry | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(imageUrl);
      req.onsuccess = () => {
        const raw = req.result as
          | { blob?: Blob; lastModified?: string; etag?: string }
          | undefined;
        db.close();
        if (raw?.blob && raw?.lastModified)
          resolve({ blob: raw.blob, lastModified: raw.lastModified });
        else if (raw?.blob)
          resolve({
            blob: raw.blob,
            lastModified: "",
          });
        else resolve(null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function getCachedLastModified(
  imageUrl: string
): Promise<string | null> {
  const entry = await getCachedImageEntry(imageUrl);
  return entry?.lastModified ?? null;
}

/** True if URL looks like a video file; we skip cache for video so the browser can use Range requests and correct MIME type. */
function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg|m4v|avi|mn4)(\?|$)/i.test(url);
}

/**
 * In-memory registry of CDN URLs deleted this session.
 * Prevents browser HTTP cache from serving stale images after R2 deletion.
 * Returns "" from getImageDisplayUrl so callers fall back to the placeholder.
 */
const deletedUrlRegistry = new Set<string>();

export function markImageUrlDeleted(imageUrl: string): void {
  if (imageUrl) deletedUrlRegistry.add(imageUrl);
}

export function isImageUrlDeleted(imageUrl: string): boolean {
  return deletedUrlRegistry.has(imageUrl);
}

/** Returns object URL if cached, otherwise the original imageUrl (browser will fetch). For video URLs we skip cache so playback works. */
export async function getImageDisplayUrl(imageUrl: string): Promise<string> {
  if (isVideoUrl(imageUrl)) return imageUrl;
  // If deleted this session, return empty so callers show fallback instead of hitting HTTP cache
  if (deletedUrlRegistry.has(imageUrl)) return "";
  const entry = await getCachedImageEntry(imageUrl);
  if (entry?.blob) return URL.createObjectURL(entry.blob);
  return imageUrl;
}

/** Kept for backward compatibility; prefer getImageDisplayUrl for UI. */
export async function getCachedImageUrl(imageUrl: string): Promise<string> {
  return getImageDisplayUrl(imageUrl);
}

export async function setCachedImage(
  imageUrl: string,
  lastModified: string,
  blob: Blob
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ blob, lastModified }, imageUrl);
    tx.oncomplete = () => db.close();
  } catch {
    // ignore
  }
}

/**
 * Removes a single image entry from IndexedDB and marks the URL as deleted
 * so getImageDisplayUrl never falls back to the browser's HTTP cache for it.
 */
export async function deleteCachedImage(imageUrl: string): Promise<void> {
  // Mark deleted immediately so any subsequent getImageDisplayUrl call returns ""
  markImageUrlDeleted(imageUrl);
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(imageUrl);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
}

export async function getCachedEtag(imageUrl: string): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(imageUrl);
      req.onsuccess = () => {
        const entry = req.result as { etag?: string } | undefined;
        db.close();
        resolve(entry?.etag ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}
