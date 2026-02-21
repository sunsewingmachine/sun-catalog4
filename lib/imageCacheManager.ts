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

/** Returns object URL if cached, otherwise the original imageUrl (browser will fetch). */
export async function getImageDisplayUrl(imageUrl: string): Promise<string> {
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
