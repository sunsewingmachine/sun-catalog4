"use client";

/**
 * Main product image and thumbnail strip. Main image: {ItmGroupName}.jpg
 * Uses cached image from IndexedDB when available; single-click strip shows here; double-click opens lightbox.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl, getCdnBase } from "@/lib/r2ImageHelper";
import Image from "next/image";
import { useImageDisplayUrl } from "@/hooks/useImageDisplayUrl";
import { SETTINGS } from "@/lib/settings";
/** Main image backbox: 16:9, max 1520px wide, height capped in .main-image-box-cap (globals.css). */

interface ProductViewerProps {
  product: Product | null;
  /** When set, main area shows this URL instead of product image (e.g. after single-click in strip or feature). */
  mainImageOverride?: string | null;
  /** When set, main area shows this URL on hover over strip thumbs; takes priority over mainImageOverride until mouse leaves. */
  mainImageHoverPreview?: string | null;
  /** When set, main area shows this video URL (e.g. after clicking a feature with video in col C). */
  mainVideoOverride?: string | null;
  /** Called when user double-clicks an image to open full-size lightbox. */
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
  /** When main image is showing an override URL and that image fails to load (e.g. variant image 404), call this to fall back to usual main image. */
  onMainImageOverrideError?: () => void;
  /** When true, show best-quality badge image at bottom-right of main image (used when exchange price box is shown). */
  showBestBadgeOverlay?: boolean;
}

export default function ProductViewer({
  product,
  mainImageOverride = null,
  mainImageHoverPreview = null,
  mainVideoOverride = null,
  onOpenLightbox,
  onMainImageOverrideError,
  showBestBadgeOverlay = false,
}: ProductViewerProps) {
  const [mainImageError, setMainImageError] = React.useState(false);
  const [tryLowercase, setTryLowercase] = React.useState(false);
  /** When true, main image has loaded so we can fade it in smoothly (avoids blink). */
  const [mainImageLoaded, setMainImageLoaded] = React.useState(false);
  const displaySrcExact = product ? getImageUrl(product.imageFilename, false) : "";
  const displaySrcLower = product ? getImageUrl(product.imageFilename, true) : "";
  const displaySrc = tryLowercase ? displaySrcLower : displaySrcExact;
  const { displayUrl: cachedMainUrl } = useImageDisplayUrl(
    displaySrc?.startsWith("http") ? displaySrc : ""
  );
  const useSample = !displaySrc || mainImageError;
  const productMainSrc = useSample ? SETTINGS.fallbackImagePath : (cachedMainUrl || displaySrc || SETTINGS.fallbackImagePath);
  const mainSrc =
    mainImageHoverPreview != null && mainImageHoverPreview !== ""
      ? mainImageHoverPreview
      : mainImageOverride != null && mainImageOverride !== ""
        ? mainImageOverride
        : productMainSrc;
  // Use mainSrc directly so leaving hover immediately shows main image (mainDisplayUrl would stay stale until cache resolves).
  const hasOverride =
    (mainImageHoverPreview != null && mainImageHoverPreview !== "") ||
    (mainImageOverride != null && mainImageOverride !== "");
  const effectiveMainSrc = mainSrc;
  const mainAlt = product?.itmGroupName ?? "Product";
  const { displayUrl: videoDisplayUrl } = useImageDisplayUrl(
    mainVideoOverride?.startsWith("http") ? mainVideoOverride : ""
  );
  const effectiveVideoSrc = videoDisplayUrl || mainVideoOverride || "";
  const showVideo = mainVideoOverride != null && mainVideoOverride !== "";
  const [videoLoading, setVideoLoading] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    setMainImageError(false);
    setTryLowercase(false);
  }, [product?.itmGroupName, displaySrcExact]);

  React.useEffect(() => {
    setMainImageLoaded(false);
  }, [effectiveMainSrc]);

  React.useEffect(() => {
    if (!showVideo) {
      setVideoLoading(false);
      setVideoError(false);
      return;
    }
    setVideoLoading(true);
    setVideoError(false);
  }, [showVideo, effectiveVideoSrc]);

  const handleVideoLoadStart = React.useCallback(() => {
    setVideoLoading(true);
    setVideoError(false);
  }, []);

  const handleVideoCanPlay = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoLoading(false);
    setVideoError(false);
    const el = e.currentTarget;
    el.play().catch(() => {});
  }, []);

  const handleVideoError = React.useCallback(() => {
    setVideoLoading(false);
    setVideoError(true);
  }, []);

  React.useEffect(() => {
    if (!mainVideoOverride) return;
    const el = document.getElementById("videoMainProduct");
    if (el && el instanceof HTMLVideoElement) el.load();
  }, [mainVideoOverride, effectiveVideoSrc]);

  const handleDoubleClickMain = () => {
    onOpenLightbox?.(mainSrc, mainAlt);
  };

  const handleMainImageError = React.useCallback(() => {
    const showingOverride = (mainImageHoverPreview == null || mainImageHoverPreview === "") && mainImageOverride != null && mainImageOverride !== "";
    if (showingOverride) {
      onMainImageOverrideError?.();
    } else if (mainImageHoverPreview == null || mainImageHoverPreview === "") {
      if (tryLowercase) setMainImageError(true);
      else setTryLowercase(true);
    }
  }, [mainImageHoverPreview, mainImageOverride, onMainImageOverrideError, tryLowercase]);

  const mainImageBoxClassName =
    "main-image-box-cap relative overflow-hidden bg-green-50 shadow-sm mx-auto outline-none focus:outline-none focus-visible:ring-0";

  if (!product) {
    return (
      <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
        <div
          id="divMainImageBackgroundBox"
          className={`${mainImageBoxClassName} min-h-0 flex-1`}
          onDoubleClick={handleDoubleClickMain}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleDoubleClickMain()}
          aria-label="Double-click to open full size"
        >
          <Image
            id="imgMainProduct"
            src={SETTINGS.fallbackImagePath}
            alt="Default"
            fill
            className="pointer-events-none object-contain rounded-2xl"
            sizes="(max-width: 800px) 100vw, 50vw"
            loading="eager"
          />
          {showBestBadgeOverlay && (
            <div id="divBestBadgeOverlay" className="absolute bottom-2 right-2 z-10 rounded-lg bg-white/90 p-1 shadow-md" aria-hidden>
              <img src="/used/best.png" alt="Best" className="h-12 w-auto object-contain md:h-14" width={56} height={56} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
      <div
        id="divMainImageBackgroundBox"
        className={`${mainImageBoxClassName} min-h-0 flex-1`}
        onDoubleClick={showVideo ? undefined : handleDoubleClickMain}
        role={showVideo ? undefined : "button"}
        tabIndex={showVideo ? undefined : 0}
        onKeyDown={showVideo ? undefined : (e) => e.key === "Enter" && handleDoubleClickMain()}
        aria-label={showVideo ? undefined : "Double-click to open full size"}
      >
        {showVideo ? (
          <div className="relative h-full w-full rounded-2xl bg-slate-900">
            <video
              id="videoMainProduct"
              src={effectiveVideoSrc || undefined}
              controls
              playsInline
              className="pointer-events-auto h-full w-full object-contain rounded-2xl"
              aria-label={`Video: ${mainAlt}`}
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
            />
            {videoLoading && (
              <div
                id="divVideoLoading"
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900/90 text-white"
                aria-live="polite"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                <span className="text-sm font-medium">Loading video…</span>
              </div>
            )}
            {videoError && !videoLoading && (
              <div
                id="divVideoError"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900/95 p-4 text-center text-white overflow-auto"
                aria-live="polite"
              >
                <span className="text-sm font-medium">Video could not load.</span>
                <span className="text-xs text-slate-300">
                  Column C in the Features sheet must be the <strong>exact filename</strong> (e.g. <code className="bg-slate-700 px-1 rounded">Ol.Happy.1st.mp4</code>), nothing else. The file must exist at <code className="bg-slate-700 px-1 rounded break-all">CatelogPicturesVideos/</code> in the bucket.
                </span>
                {/\.(avi|mov)(\?|$)/i.test(effectiveVideoSrc) && (
                  <span className="text-xs text-amber-200">
                    AVI and MOV are often not supported in browsers. Re-encode to <strong>MP4</strong> or WebM for reliable playback.
                  </span>
                )}
                {effectiveVideoSrc && (
                  <a
                    id="linkVideoOpenNewTab"
                    href={effectiveVideoSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline text-teal-300 hover:text-teal-200 shrink-0"
                  >
                    Open video URL in new tab
                  </a>
                )}
                <code className="max-h-20 w-full overflow-auto break-all text-[10px] text-slate-400 text-left px-2 py-1 rounded bg-slate-800" title="Full URL">
                  {effectiveVideoSrc || ""}
                </code>
              </div>
            )}
          </div>
        ) : effectiveMainSrc.startsWith("http") || effectiveMainSrc.startsWith("blob:") ? (
          <img
            key={effectiveMainSrc}
            id="imgMainProduct"
            src={effectiveMainSrc}
            alt={mainAlt}
            className="pointer-events-none h-full w-full object-contain rounded-2xl opacity-100"
            loading="eager"
            referrerPolicy="no-referrer"
            onLoad={() => setMainImageLoaded(true)}
            onError={handleMainImageError}
            draggable={false}
          />
        ) : (
          <Image
            key={effectiveMainSrc}
            id="imgMainProduct"
            src={effectiveMainSrc}
            alt={mainAlt}
            fill
            className="pointer-events-none object-contain rounded-2xl opacity-100"
            sizes="(max-width: 800px) 100vw, 50vw"
            loading="eager"
            onLoad={() => setMainImageLoaded(true)}
            onError={handleMainImageError}
            draggable={false}
          />
        )}
        {showBestBadgeOverlay && product && (
          <div id="divBestBadgeOverlay" className="absolute bottom-2 right-2 z-10 rounded-lg bg-white/90 p-1 shadow-md" aria-hidden>
            <img src="/used/best.png" alt="Best" className="h-12 w-auto object-contain md:h-14" width={56} height={56} />
          </div>
        )}
        {useSample && product && !hasOverride && (
          <div
            id="divImageNotLoadingOverlay"
            className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1 rounded-t-xl bg-slate-900/95 px-3 py-2 text-center text-amber-200 shadow-lg"
            aria-live="polite"
          >
            <span className="text-xs font-medium">Main image not loading</span>
            <code className="max-h-12 overflow-auto break-all text-[10px] text-slate-300 px-2 py-0.5 rounded bg-slate-800" title="URL">
              {displaySrc}
            </code>
            {displaySrc.startsWith("/images/") && !getCdnBase() ? (
              <span className="text-[10px] text-slate-400">
                Set CDN base URL in your deployment env and redeploy (env is applied at build time).
              </span>
            ) : !displaySrc.includes("/items/") && getCdnBase() ? (
              <span className="text-[10px] text-slate-400">
                Add CDN image prefix in env and redeploy. R2 keys are case-sensitive.
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
