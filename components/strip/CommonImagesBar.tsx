"use client";

/**
 * Full-width bottom bar showing common images; uses cached images when available.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import Image from "next/image";
import CachedImage from "@/components/shared/CachedImage";

/** Fallback when no image or common images bar is empty. */
const DEFAULT_IMAGE = "/used/default.jpg";

interface CommonImagesBarProps {
  products: Product[];
  /** Single-click sets this image as the main viewer image. */
  onSetMainImage?: (imageUrl: string) => void;
  /** Double-click opens full-size zoomable lightbox. */
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
}

function getCommonImageFilenames(products: Product[]): string[] {
  const countByFile: Record<string, number> = {};
  for (const p of products) {
    if (!p.imageFilename) continue;
    countByFile[p.imageFilename] = (countByFile[p.imageFilename] ?? 0) + 1;
  }
  return Object.entries(countByFile)
    .filter(([, count]) => count > 1)
    .map(([filename]) => filename)
    .slice(0, 50);
}

export default function CommonImagesBar({
  products,
  onSetMainImage,
  onOpenLightbox,
}: CommonImagesBarProps) {
  const commonFilenames = React.useMemo(
    () => getCommonImageFilenames(products),
    [products]
  );

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-14 shrink-0 items-center border-t-2 border-green-300 bg-green-200 px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      aria-label="Common images"
    >
      <div className="scrollbar-hide flex flex-1 items-center gap-3 overflow-x-auto py-1">
        {commonFilenames.length === 0 ? (
          <button
            type="button"
            className="h-8 w-10 shrink-0 overflow-hidden rounded-lg border border-green-300 bg-white shadow-sm cursor-pointer"
            title="Default image. Click to show in main; double-click for full size."
            onClick={() => onSetMainImage?.(DEFAULT_IMAGE)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenLightbox?.(DEFAULT_IMAGE, "Default");
            }}
          >
            <Image
              src={DEFAULT_IMAGE}
              alt="Default"
              width={40}
              height={32}
              className="h-full w-full object-cover pointer-events-none"
            />
          </button>
        ) : (
          commonFilenames.map((filename) => {
            const src = getImageUrl(filename);
            const displaySrc = src || DEFAULT_IMAGE;
            return (
              <button
                key={filename}
                type="button"
                className="h-8 w-10 shrink-0 overflow-hidden rounded-lg border border-green-300 bg-white shadow-sm cursor-pointer"
                title="Click to show in main; double-click for full size"
                onClick={() => onSetMainImage?.(displaySrc)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  onOpenLightbox?.(displaySrc, filename);
                }}
              >
                {src ? (
                  <CachedImage
                    src={displaySrc}
                    alt=""
                    width={40}
                    height={32}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-green-100 text-[10px] text-slate-400">
                    —
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </footer>
  );
}
