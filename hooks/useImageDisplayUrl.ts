/**
 * Resolves image URL from IndexedDB cache (object URL) or returns network URL.
 * Keeps previous displayUrl until the new one is ready to avoid blink; revokes blob URLs on unmount.
 */

import { useEffect, useRef, useState } from "react";
import { getImageDisplayUrl } from "@/lib/imageCacheManager";

export function useImageDisplayUrl(
  imageUrl: string
): { displayUrl: string | null; isReady: boolean } {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      const toRevoke = blobUrlRef.current;
      blobUrlRef.current = null;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      setDisplayUrl(null);
      setIsReady(true);
      return;
    }
    let cancelled = false;
    setIsReady(false);
    // Keep previous displayUrl until new URL resolves to avoid blink (stale-while-revalidate).
    getImageDisplayUrl(imageUrl).then((url) => {
      if (cancelled) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        return;
      }
      const prevBlob = blobUrlRef.current;
      blobUrlRef.current = url.startsWith("blob:") ? url : null;
      if (prevBlob) URL.revokeObjectURL(prevBlob);
      setDisplayUrl(url);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
      // Do not revoke here when imageUrl changed so the previous image stays visible until the new one loads.
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      const toRevoke = blobUrlRef.current;
      blobUrlRef.current = null;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
    };
  }, []);

  return { displayUrl, isReady };
}
