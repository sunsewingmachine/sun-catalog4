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
  /** When provided, hovering a thumb shows this URL in main area; pass null on mouse leave. */
  onHoverMainImage?: (url: string | null) => void;
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
  /** When true, used in 3-row area: no top border (no divider below previous row). */
  noTopBorder?: boolean;
}

function ThumbButton({
  filename,
  folder,
  onSetMainImage,
  onHoverMainImage,
  onOpenLightbox,
}: {
  filename: string;
  folder: BarImageFolder;
  onSetMainImage: ServerImagesStripProps["onSetMainImage"];
  onHoverMainImage: ServerImagesStripProps["onHoverMainImage"];
  onOpenLightbox: ServerImagesStripProps["onOpenLightbox"];
}) {
  const src = getImageUrlForFolder(filename, folder);
  const displaySrc = src || DEFAULT_IMAGE;
  return (
    <button
      type="button"
      className={`${THUMB_CLASS} shrink-0 overflow-hidden rounded-lg border-2 border-green-200 bg-green-200 shadow-sm transition-colors hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-teal-500`}
      title="Click to show in main; double-click for full size"
      onClick={() => onSetMainImage?.(displaySrc)}
      onMouseEnter={() => onHoverMainImage?.(displaySrc)}
      onMouseLeave={() => onHoverMainImage?.(null)}
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
        <div className="flex h-full w-full items-center justify-center bg-green-200 text-xs text-slate-500">
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
  onHoverMainImage,
  onOpenLightbox,
  noTopBorder = false,
}: ServerImagesStripProps) {
  const wrapperClass = noTopBorder
    ? "flex h-16 min-w-0 shrink-0 overflow-hidden bg-transparent p-2"
    : "flex h-16 min-w-0 shrink-0 overflow-hidden border-t border-green-200 bg-green-50 p-2";
  return (
    <div
      className={wrapperClass}
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
              onHoverMainImage={onHoverMainImage}
              onOpenLightbox={onOpenLightbox}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
