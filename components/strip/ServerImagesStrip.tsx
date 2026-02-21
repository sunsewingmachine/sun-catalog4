"use client";

/**
 * Horizontal strip of server images (ForAll or ForGroup) with compact thumbs.
 * Used as row 2 (category/ForGroup) and row 3 (common/ForAll) below main image.
 */

import React from "react";
import { getImageUrlForFolder } from "@/lib/r2ImageHelper";
import type { BarImageFolder } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";

const DEFAULT_IMAGE = "/used/default.jpg";
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 48;
const THUMB_CLASS = "h-12 w-16";

interface ServerImagesStripProps {
  /** Row label for aria. */
  ariaLabel: string;
  /** Server folder: ForAll (common) or ForGroup (category). */
  folder: BarImageFolder;
  /** Image filenames to show in this row. */
  filenames: string[];
  onSetMainImage?: (url: string) => void;
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
}

function ThumbButton({
  filename,
  folder,
  onSetMainImage,
  onOpenLightbox,
}: {
  filename: string;
  folder: BarImageFolder;
  onSetMainImage: ServerImagesStripProps["onSetMainImage"];
  onOpenLightbox: ServerImagesStripProps["onOpenLightbox"];
}) {
  const src = getImageUrlForFolder(filename, folder);
  const displaySrc = src || DEFAULT_IMAGE;
  return (
    <button
      type="button"
      className={`${THUMB_CLASS} shrink-0 overflow-hidden rounded-lg border-2 border-green-200 bg-white shadow-sm transition-colors hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-teal-500`}
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
          width={THUMB_WIDTH}
          height={THUMB_HEIGHT}
          className="h-full w-full object-cover pointer-events-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500">
          —
        </div>
      )}
    </button>
  );
}

export default function ServerImagesStrip({
  ariaLabel,
  folder,
  filenames,
  onSetMainImage,
  onOpenLightbox,
}: ServerImagesStripProps) {
  return (
    <div
      className="flex h-16 min-w-0 shrink-0 overflow-hidden border-t border-green-200 bg-green-50 p-2"
      aria-label={ariaLabel}
    >
      <div
        className="horizontal-scroll size-full min-w-0 overflow-x-scroll"
        style={{ width: "100%", maxWidth: "100%" }}
        role="region"
        aria-label={ariaLabel}
      >
        <div className="flex h-full w-max min-h-full items-center gap-1.5 py-1">
          {filenames.map((filename) => (
            <ThumbButton
              key={filename}
              filename={filename}
              folder={folder}
              onSetMainImage={onSetMainImage}
              onOpenLightbox={onOpenLightbox}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
