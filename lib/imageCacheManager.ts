/**
 * Per-URL ETag storage; conditional GET (If-None-Match); only download on 200.
 * For now returns the URL; full ETag/cache implementation can be added when CDN supports it.
 */

import { openDb } from "./indexedDb";

const STORE = "imageCache";

export async function getCachedImageUrl(imageUrl: string): Promise<string> {
  return imageUrl;
}

export async function setCachedImage(
  _imageUrl: string,
  _etag: string,
  _blob: Blob
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ etag: _etag, blob: _blob }, _imageUrl);
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
