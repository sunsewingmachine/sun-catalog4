/**
 * Compares remote version (db sheet B1) with cached version. If remote is newer or no cache, trigger fetch.
 * Client uses shouldFetchCatalogFromApi() (no sheet ID). Server/API may use getRemoteVersion.
 */

import { fetchDbVersion } from "./dbVersionFetcher";
import { getCachedCatalog } from "./cacheManager";

export async function getRemoteVersion(
  sheetId: string,
  dbGid: string
): Promise<string> {
  return fetchDbVersion(sheetId, dbGid);
}

/** Client-safe: fetches version via API so sheet ID never reaches the client. */
export async function shouldFetchCatalogFromApi(): Promise<{
  shouldFetch: boolean;
  cachedVersion: string | null;
}> {
  let remoteVersion = "";
  try {
    const res = await fetch("/api/catalog-version");
    if (res.ok) {
      const data = await res.json();
      remoteVersion = (data.version ?? "").toString();
    }
  } catch {
    // offline or API error
  }
  const cached = await getCachedCatalog();
  const cachedVersion = cached?.meta?.version ?? null;
  const shouldFetch =
    !cachedVersion || remoteVersion > cachedVersion || remoteVersion !== cachedVersion;
  return { shouldFetch, cachedVersion };
}

export async function shouldFetchCatalog(
  sheetId: string,
  dbGid: string
): Promise<{ shouldFetch: boolean; cachedVersion: string | null }> {
  const [remoteVersion, cached] = await Promise.all([
    getRemoteVersion(sheetId, dbGid),
    getCachedCatalog(),
  ]);
  const cachedVersion = cached?.meta?.version ?? null;
  const shouldFetch =
    !cachedVersion || remoteVersion > cachedVersion || remoteVersion !== cachedVersion;
  return { shouldFetch, cachedVersion };
}
