"use client";

/**
 * Horizontal strip of server images (ForAll or ForGroup) with compact thumbs.
 * Used as row 2 (category/ForGroup) and row 3 (common/ForAll) below main image.
 */

import React from "react";
import { getImageUrlForFolder } from "@/lib/r2ImageHelper";
import type { BarImageFolder } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";
import { SETTINGS } from "@/lib/settings";
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 48;
const THUMB_CLASS = "h-12 w-16";

/** Pads list to at least minLength with null placeholders. */
function padToMinSlots<T>(list: T[], minLength: number): (T | null)[] {
  if (list.length >= minLength) return list;
  return [...list, ...Array(minLength - list.length).fill(null)];
}

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
  /** Minimum number of image holder slots (pad with placeholders). Used for row 2 (Cat) only. */
  minSlots?: number;
  /** Center-align the strip content within the row. Used for row 2 (Cat) only. */
  centerAlign?: boolean;
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
  const displaySrc = src || SETTINGS.fallbackImagePath;
  return (
    <button
      type="button"
      className={`${THUMB_CLASS} shrink-0 overflow-hidden rounded-xl border-4 border-green-200 bg-green-100 shadow-md transition-all duration-200 hover:shadow-lg hover:border-green-200 hover:bg-green-100 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1`}
      title="Click for full size; double-click to show in main"
      onClick={(e) => {
        e.preventDefault();
        onOpenLightbox?.(displaySrc, filename);
      }}
      onDoubleClick={() => onSetMainImage?.(displaySrc)}
      onMouseEnter={() => onHoverMainImage?.(displaySrc)}
      onMouseLeave={() => onHoverMainImage?.(null)}
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
        <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500 rounded-xl">
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
  minSlots,
  centerAlign = false,
}: ServerImagesStripProps) {
  const slots = minSlots != null ? padToMinSlots(filenames, minSlots) : filenames;
  const wrapperClass = noTopBorder
    ? "flex h-16 min-w-0 shrink-0 overflow-hidden bg-transparent p-2"
    : "flex h-16 min-w-0 shrink-0 overflow-hidden border-t border-green-100 bg-green-50/80 p-2";
  const content = (
    <div className="flex h-full w-max min-h-full items-center gap-1.5 py-1">
      {slots.map((filename, index) =>
        filename === null ? (
          <div
            key={`placeholder-${index}`}
            aria-hidden
            className={`${THUMB_CLASS} shrink-0 overflow-hidden rounded-xl border-4 border-green-200 bg-green-100`}
          />
        ) : (
          <ThumbButton
            key={filename}
            filename={filename}
            folder={folder}
            onSetMainImage={onSetMainImage}
            onHoverMainImage={onHoverMainImage}
            onOpenLightbox={onOpenLightbox}
          />
        )
      )}
    </div>
  );
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
        {centerAlign ? (
          <div className="flex h-full min-w-full justify-center">
            {content}
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
