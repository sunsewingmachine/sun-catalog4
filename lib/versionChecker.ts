/**
 * Compares remote version (db sheet B1) with cached version. If remote is newer or no cache, trigger fetch.
 */

import { fetchDbVersion } from "./dbVersionFetcher";
import { getCachedCatalog } from "./cacheManager";

export async function getRemoteVersion(
  sheetId: string,
  dbGid: string
): Promise<string> {
  return fetchDbVersion(sheetId, dbGid);
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
