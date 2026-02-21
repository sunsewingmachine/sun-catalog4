"use client";

/**
 * Horizontal strip of additional images for the selected product (Area 2).
 * Shows main image plus convention-based extras: {itmGroupName} (1).jpg, (2).jpg, etc.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";

const DEFAULT_IMAGE = "/used/default.jpg";
const MAX_ADDITIONAL = 5;

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
  onOpenLightbox: (imageSrc: string, imageAlt: string) => void;
}

export default function AdditionalImagesStrip({
  product,
  onSetMainImage,
  onOpenLightbox,
}: AdditionalImagesStripProps) {
  const filenames = React.useMemo(
    () => getAdditionalImageFilenames(product),
    [product?.itmGroupName]
  );

  if (!product) {
    return (
      <div
        id="divAdditionalImagesStrip"
        className="scrollbar-hide flex h-24 shrink-0 items-center gap-2 overflow-x-auto border-t border-green-200 bg-green-50 p-2"
        aria-label="Additional images for selected product"
      />
    );
  }

  return (
    <div
      id="divAdditionalImagesStrip"
      className="scrollbar-hide flex h-24 shrink-0 items-center gap-2 overflow-x-auto border-t border-green-200 bg-green-50 p-2"
      aria-label="Additional images for selected product"
    >
      {filenames.map((filename) => {
        const src = getImageUrl(filename);
        const displaySrc = src || DEFAULT_IMAGE;
        return (
          <button
            key={filename}
            type="button"
            className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-green-200 bg-white shadow-sm transition-colors hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            title="Click to show in main; double-click for full size"
            onClick={() => onSetMainImage(displaySrc)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenLightbox(displaySrc, filename);
            }}
          >
            {src ? (
              <CachedImage
                src={displaySrc}
                alt={filename}
                width={80}
                height={64}
                className="h-full w-full object-cover pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500">
                —
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
