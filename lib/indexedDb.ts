/**
 * IndexedDB open and get/set helpers for catalog and image cache.
 * Stores: catalog (products + meta), imageCache (url -> { etag, blob }).
 */

const DB_NAME = "SunCatalogDB";
const DB_VERSION = 1;
const STORE_CATALOG = "catalog";
const STORE_IMAGE_CACHE = "imageCache";

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CATALOG)) {
        db.createObjectStore(STORE_CATALOG);
      }
      if (!db.objectStoreNames.contains(STORE_IMAGE_CACHE)) {
        db.createObjectStore(STORE_IMAGE_CACHE);
      }
    };
  });
}

export async function getCatalogFromDb(): Promise<{
  products: unknown[];
  meta: { version: string; lastUpdated: string };
} | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOG, "readonly");
    const store = tx.objectStore(STORE_CATALOG);
    const productsReq = store.get("products");
    const metaReq = store.get("meta");
    let done = 0;
    let products: unknown[] | null = null;
    let meta: { version: string; lastUpdated: string } | null = null;
    const check = () => {
      if (done < 2) return;
      db.close();
      if (products && meta && Array.isArray(products)) resolve({ products, meta });
      else resolve(null);
    };
    productsReq.onsuccess = () => {
      products = (productsReq.result as unknown[]) ?? null;
      done++;
      check();
    };
    metaReq.onsuccess = () => {
      meta = metaReq.result as { version: string; lastUpdated: string } | null;
      done++;
      check();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function setCatalogInDb(
  products: unknown[],
  meta: { version: string; lastUpdated: string }
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOG, "readwrite");
    const store = tx.objectStore(STORE_CATALOG);
    store.put(products, "products");
    store.put(meta, "meta");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export const INDEXED_DB = {
  DB_NAME,
  STORE_CATALOG,
  STORE_IMAGE_CACHE,
};
