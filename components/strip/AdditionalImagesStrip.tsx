"use client";

/**
 * Horizontal strip of additional images for the selected product (Area 2).
 * Shows main image plus convention-based extras: {itmGroupName} (1).jpg, (2).jpg, etc.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";
import { SETTINGS } from "@/lib/settings";
const MAX_ADDITIONAL = 5;

/** Compact thumb size (a little smaller than original) for use in 3-row layout below main image. */
const COMPACT_THUMB = { width: 64, height: 48, class: "h-12 w-16" };
const DEFAULT_THUMB = { width: 80, height: 64, class: "h-16 w-20" };

function getAdditionalImageFilenames(product: Product | null): string[] {
  if (!product?.imageFilename) return [];
  const base = product.imageFilename.replace(/\.jpg$/i, "");
  const filenames: string[] = [product.imageFilename];
  for (let i = 1; i <= MAX_ADDITIONAL; i++) {
    filenames.push(`${base} (${i}).jpg`);
  }
  return filenames;
}

interface AdditionalImagesStripProps {
  product: Product | null;
  onSetMainImage: (url: string) => void;
  /** When provided, hovering a thumb shows this URL in main area; pass null on mouse leave. */
  onHoverMainImage?: (url: string | null) => void;
  onOpenLightbox: (imageSrc: string, imageAlt: string) => void;
  /** When true, use smaller thumbs for 3-row layout below main image. */
  compact?: boolean;
}

export default function AdditionalImagesStrip({
  product,
  onSetMainImage,
  onHoverMainImage,
  onOpenLightbox,
  compact = false,
}: AdditionalImagesStripProps) {
  const filenames = React.useMemo(
    () => getAdditionalImageFilenames(product),
    [product?.itmGroupName]
  );
  const thumb = compact ? COMPACT_THUMB : DEFAULT_THUMB;
  const rowStyle = compact ? "flex min-w-0 shrink-0 overflow-hidden bg-transparent p-2 h-16" : "flex min-w-0 shrink-0 overflow-hidden border-t border-green-200 bg-green-50 p-2 h-24";

  return (
    <div
      id="divAdditionalImagesStrip"
      className={rowStyle}
      aria-label="Additional images for selected product"
    >
      <div
        className="horizontal-scroll size-full min-w-0 overflow-x-scroll"
        style={{ width: "100%", maxWidth: "100%" }}
        role="region"
        aria-label="Additional images strip"
      >
        <div className="flex h-full w-max min-h-full items-center gap-1.5 py-1">
          {product
            ? filenames.map((filename) => {
                const src = getImageUrl(filename);
                const displaySrc = src || SETTINGS.fallbackImagePath;
                return (
                  <button
                    key={filename}
                    type="button"
                    className={`${thumb.class} shrink-0 overflow-hidden rounded-xl border border-green-200/90 bg-white/95 shadow-md transition-all duration-200 hover:shadow-lg hover:border-green-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1`}
                    title="Click for full size; double-click to show in main"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLightbox(displaySrc, filename);
                    }}
                    onDoubleClick={() => onSetMainImage(displaySrc)}
                    onMouseEnter={() => onHoverMainImage?.(displaySrc)}
                    onMouseLeave={() => onHoverMainImage?.(null)}
                  >
                    {src ? (
                      <CachedImage
                        src={displaySrc}
                        alt={filename}
                        width={thumb.width}
                        height={thumb.height}
                        className="h-full w-full object-cover pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-green-50 text-xs text-slate-500 rounded-xl">
                        —
                      </div>
                    )}
                  </button>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
