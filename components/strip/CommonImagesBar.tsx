"use client";

/**
 * Full-width bottom bar: ForAll images first, then ForGroup images filtered by selected item category prefix.
 * Uses getImageUrlForFolder for CDN URLs; uses cached images when available.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrlForFolder } from "@/lib/r2ImageHelper";
import Image from "next/image";
import CachedImage from "@/components/shared/CachedImage";

/** Fallback when no image or bar is empty. */
const DEFAULT_IMAGE = "/used/default.jpg";

/** Derives category prefix from itmGroupName (e.g. "Sv.Happy.1st" → "Sv"). Used to filter ForGroup images. */
function getCategoryPrefix(itmGroupName: string): string {
  if (!itmGroupName) return "";
  const dot = itmGroupName.indexOf(".");
  return dot >= 0 ? itmGroupName.slice(0, dot) : itmGroupName;
}

interface CommonImagesBarProps {
  /** Image filenames in the server ForAll folder. */
  forAllFilenames: string[];
  /** Image filenames in the server ForGroup folder; shown filtered by selected product category prefix. */
  forGroupFilenames: string[];
  /** Currently selected product; used to filter ForGroup to filenames starting with category prefix (e.g. Sv). */
  selectedProduct: Product | null;
  /** When "r2_not_configured", bar shows a hint to set R2 env vars. */
  barImagesHint?: "r2_not_configured";
  /** Single-click sets this image as the main viewer image. */
  onSetMainImage?: (imageUrl: string) => void;
  /** Double-click opens full-size zoomable lightbox. */
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
}

function renderBarThumb(
  filename: string,
  src: string,
  displaySrc: string,
  onSetMainImage: CommonImagesBarProps["onSetMainImage"],
  onOpenLightbox: CommonImagesBarProps["onOpenLightbox"]
) {
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
}

export default function CommonImagesBar({
  forAllFilenames,
  forGroupFilenames,
  selectedProduct,
  barImagesHint,
  onSetMainImage,
  onOpenLightbox,
}: CommonImagesBarProps) {
  const categoryPrefix = React.useMemo(
    () => (selectedProduct ? getCategoryPrefix(selectedProduct.itmGroupName) : ""),
    [selectedProduct]
  );

  const forGroupFiltered = React.useMemo(() => {
    if (!categoryPrefix) return [];
    const lower = categoryPrefix.toLowerCase();
    return forGroupFilenames.filter((f) => f.toLowerCase().startsWith(lower));
  }, [forGroupFilenames, categoryPrefix]);

  const hasAny = forAllFilenames.length > 0 || forGroupFiltered.length > 0;

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-14 shrink-0 items-center border-t-2 border-green-300 bg-green-200 px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      aria-label="ForAll and ForGroup images"
    >
      <div className="scrollbar-hide flex flex-1 items-center gap-3 overflow-x-auto py-1">
        {!hasAny ? (
          <div className="flex items-center gap-3">
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
            {barImagesHint === "r2_not_configured" && (
              <span className="text-xs text-amber-800" title="Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME to list ForAll/ForGroup images">
                No bar images — set R2 env to list server folders
              </span>
            )}
          </div>
        ) : (
          <>
            {forAllFilenames.map((filename) => {
              const src = getImageUrlForFolder(filename, "ForAll");
              const displaySrc = src || DEFAULT_IMAGE;
              return renderBarThumb(filename, src, displaySrc, onSetMainImage, onOpenLightbox);
            })}
            {forGroupFiltered.map((filename) => {
              const src = getImageUrlForFolder(filename, "ForGroup");
              const displaySrc = src || DEFAULT_IMAGE;
              return renderBarThumb(filename, src, displaySrc, onSetMainImage, onOpenLightbox);
            })}
          </>
        )}
      </div>
    </footer>
  );
}
