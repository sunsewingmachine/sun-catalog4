"use client";

/**
 * Full-width bottom bar. When purpose is "flash", reserves space for flash messages (no images).
 * When purpose is "images", shows ForAll then ForGroup thumbs (legacy; images now shown in 3-row area below main).
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
  /** "flash" = reserve bar for flash messages only (no images). "images" = show ForAll/ForGroup thumbs (legacy). */
  purpose?: "flash" | "images";
  /** Image filenames in the server ForAll folder (used when purpose is "images"). */
  forAllFilenames?: string[];
  /** Image filenames in the server ForGroup folder (used when purpose is "images"). */
  forGroupFilenames?: string[];
  /** Currently selected product; used to filter ForGroup when purpose is "images". */
  selectedProduct?: Product | null;
  /** When "r2_not_configured", bar shows a hint (only when purpose is "images"). */
  barImagesHint?: "r2_not_configured";
  /** Single-click sets this image as the main viewer image (when purpose is "images"). */
  onSetMainImage?: (imageUrl: string) => void;
  /** Double-click opens full-size zoomable lightbox (when purpose is "images"). */
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
      className="h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-green-300 bg-white shadow-sm cursor-pointer"
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
          width={48}
          height={40}
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
  purpose = "flash",
  forAllFilenames = [],
  forGroupFilenames = [],
  selectedProduct = null,
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

  if (purpose === "flash") {
    return (
      <footer
        id="divCommonImagesBar"
        className="flex h-12 min-w-0 shrink-0 items-center overflow-hidden border-t border-green-200 bg-green-200 px-2 py-0.5"
        aria-label="Flash messages"
      >
        <div className="min-w-0 flex-1" role="region" aria-live="polite" />
      </footer>
    );
  }

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-16 min-w-0 shrink-0 items-center overflow-hidden bg-green-200 px-2 py-0.5"
      aria-label="ForAll and ForGroup images"
    >
      <div
        className="horizontal-scroll min-w-0 flex-1 basis-0 overflow-x-scroll"
        style={{ width: "100%", maxWidth: "100%" }}
      >
        <div className="flex w-max items-center gap-1.5">
          {!hasAny ? (
            <>
              <button
                type="button"
                className="h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-green-300 bg-white shadow-sm cursor-pointer"
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
                  width={48}
                  height={40}
                  className="h-full w-full object-cover pointer-events-none"
                />
              </button>
              {barImagesHint === "r2_not_configured" && (
                <span className="text-xs text-amber-800" title="Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME to list ForAll/ForGroup images">
                  No bar images — set R2 env to list server folders
                </span>
              )}
            </>
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
      </div>
    </footer>
  );
}
