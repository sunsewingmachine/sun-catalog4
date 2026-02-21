/**
 * Resolves image URL from IndexedDB cache (object URL) or returns network URL. Revokes blob URL on unmount.
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
      setDisplayUrl(null);
      setIsReady(true);
      return;
    }
    let cancelled = false;
    setDisplayUrl(null);
    setIsReady(false);
    getImageDisplayUrl(imageUrl).then((url) => {
      if (cancelled) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        return;
      }
      blobUrlRef.current = url.startsWith("blob:") ? url : null;
      setDisplayUrl(url);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
      const toRevoke = blobUrlRef.current;
      blobUrlRef.current = null;
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      setDisplayUrl(null);
      setIsReady(false);
    };
  }, [imageUrl]);

  return { displayUrl, isReady };
}
