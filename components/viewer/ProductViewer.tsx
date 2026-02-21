"use client";

/**
 * Main product image and thumbnail strip. Main image: {ItmGroupName}.jpg
 * Single-click other images (e.g. strip) shows them here; double-click opens full-size zoomable lightbox.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl, getCdnBase } from "@/lib/r2ImageHelper";
import Image from "next/image";

/** Fallback when product image is missing or fails to load. */
const DEFAULT_IMAGE = "/used/default.jpg";

interface ProductViewerProps {
  product: Product | null;
  /** When set, main area shows this URL instead of product image (e.g. after single-click in strip). */
  mainImageOverride?: string | null;
  /** Called when user double-clicks an image to open full-size lightbox. */
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
}

export default function ProductViewer({
  product,
  mainImageOverride = null,
  onOpenLightbox,
}: ProductViewerProps) {
  const [mainImageError, setMainImageError] = React.useState(false);
  const [tryLowercase, setTryLowercase] = React.useState(false);
  const displaySrcExact = product ? getImageUrl(product.imageFilename, false) : "";
  const displaySrcLower = product ? getImageUrl(product.imageFilename, true) : "";
  const displaySrc = tryLowercase ? displaySrcLower : displaySrcExact;
  const useSample = !displaySrc || mainImageError;
  const productMainSrc = useSample ? DEFAULT_IMAGE : displaySrc;
  const mainSrc =
    mainImageOverride != null && mainImageOverride !== ""
      ? mainImageOverride
      : productMainSrc;
  const mainAlt = product?.itmGroupName ?? "Product";

  React.useEffect(() => {
    setMainImageError(false);
    setTryLowercase(false);
  }, [product?.itmGroupName, displaySrcExact]);

  const handleDoubleClickMain = () => {
    onOpenLightbox?.(mainSrc, mainAlt);
  };

  if (!product) {
    return (
      <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/90 shadow-sm"
          onDoubleClick={handleDoubleClickMain}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleDoubleClickMain()}
          aria-label="Double-click to open full size"
        >
          <Image
            id="imgMainProduct"
            src={DEFAULT_IMAGE}
            alt="Default"
            fill
            className="pointer-events-none object-contain"
            sizes="(max-width: 800px) 100vw, 50vw"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return (
    <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/90 shadow-sm"
        onDoubleClick={handleDoubleClickMain}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleDoubleClickMain()}
        aria-label="Double-click to open full size"
      >
        {mainSrc.startsWith("http") ? (
          <img
            id="imgMainProduct"
            src={mainSrc}
            alt={mainAlt}
            className="pointer-events-none h-full w-full object-contain"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => (tryLowercase ? setMainImageError(true) : setTryLowercase(true))}
            draggable={false}
          />
        ) : (
          <Image
            id="imgMainProduct"
            src={mainSrc}
            alt={mainAlt}
            fill
            className="pointer-events-none object-contain"
            sizes="(max-width: 800px) 100vw, 50vw"
            loading="eager"
            onError={() => (tryLowercase ? setMainImageError(true) : setTryLowercase(true))}
            draggable={false}
          />
        )}
      </div>
      {useSample && product && (
        <p id="pImageDebug" className="mt-1 text-xs text-amber-700">
          Image not loading. URL: <code className="break-all">{displaySrc}</code>
          {!displaySrc.includes("/items/") && getCdnBase() ? (
            <> — Add <code>NEXT_PUBLIC_CDN_IMAGE_PREFIX=items</code> to .env.local and restart dev server.</>
          ) : null}
        </p>
      )}
      <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto">
        <div
          className="h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm"
          onDoubleClick={() =>
            onOpenLightbox?.(
              displaySrc || DEFAULT_IMAGE,
              `${product.itmGroupName} thumb`
            )
          }
          role="button"
          tabIndex={0}
          aria-label="Double-click to open full size"
        >
          {(displaySrc || DEFAULT_IMAGE).startsWith("http") ? (
            <img
              src={displaySrc || DEFAULT_IMAGE}
              alt={`${product.itmGroupName} thumb`}
              className="h-full w-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          ) : (
            <Image
              src={displaySrc || DEFAULT_IMAGE}
              alt={`${product.itmGroupName} thumb`}
              width={80}
              height={64}
              className="h-full w-full object-cover pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
