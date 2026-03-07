"use client";

/**
 * Horizontal strip of additional images for the selected product (Etc row).
 * Normal mode: shows product images + placeholders.
 * Media mode: × on existing images, + on empty slots (filename is predetermined by slot position).
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl, getFallbackImageUrl } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";


const MAX_ADDITIONAL = 5;
/** Minimum number of image holder slots to show in row 1 (Etc); pad with placeholders if fewer. */
const MIN_IMAGE_HOLDERS = 16;
/** Fixed number of slots shown in media management mode (matches Cat/Gen rows). */
const MEDIA_SLOT_COUNT = 25;

/** Compact thumb size (a little smaller than original) for use in 3-row layout below main image. */
const COMPACT_THUMB = { width: 64, height: 48, class: "h-12 w-16" };
const DEFAULT_THUMB = { width: 80, height: 64, class: "h-16 w-20" };

/** Builds convention-based filenames for a product up to `count` total slots (main + extras). */
function getAdditionalImageFilenames(product: Product | null, count = MAX_ADDITIONAL + 1): string[] {
  if (!product?.imageFilename) return [];
  const base = product.imageFilename.replace(/\.jpg$/i, "");
  const filenames: string[] = [product.imageFilename];
  for (let i = 1; i < count; i++) {
    filenames.push(`${base} (${i}).jpg`);
  }
  return filenames;
}

/** Pads list to at least minLength with null placeholders. */
function padToMinSlots<T>(list: T[], minLength: number): (T | null)[] {
  if (list.length >= minLength) return list;
  return [...list, ...Array(minLength - list.length).fill(null)];
}

interface AdditionalImagesStripProps {
  product: Product | null;
  onSetMainImage: (url: string) => void;
  /** When provided, hovering a thumb shows this URL in main area; pass null on mouse leave. */
  onHoverMainImage?: (url: string | null) => void;
  onOpenLightbox: (imageSrc: string, imageAlt: string) => void;
  /** When true, use smaller thumbs for 3-row layout below main image. */
  compact?: boolean;
  /** When true, shows × on existing images and + on empty slots. */
  manageMediaMode?: boolean;
  /** Called when admin deletes an Etc image. folder is always "Items". */
  onMediaDelete?: (folder: "Items", filename: string) => Promise<void>;
  /**
   * Called when admin uploads a file to an empty Etc slot.
   * filename is the predetermined slot name (e.g. "Sv.Sun.Special (1).jpg").
   */
  onMediaUpload?: (folder: "Items", filename: string, file: File) => Promise<void>;
  /**
   * Set of filenames deleted this session, maintained at layout level so navigating between
   * products doesn't reset this knowledge and cause deleted images to reappear.
   */
  deletedFilenames?: Set<string>;
  /**
   * Set of filenames uploaded this session, maintained at layout level to override
   * convention-based existence checks for newly uploaded images.
   */
  uploadedFilenames?: Set<string>;
}

// ─── Media mode thumb with × button ──────────────────────────────────────────

function EtcMediaThumb({
  filename,
  thumbWidth,
  thumbHeight,
  thumbClass,
  onDelete,
  onHoverMainImage,
}: {
  filename: string;
  thumbWidth: number;
  thumbHeight: number;
  thumbClass: string;
  onDelete: (filename: string) => void;
  onHoverMainImage?: (url: string | null) => void;
}) {
  const [busy, setBusy] = React.useState(false);

  const src = getImageUrl(filename);
  const displaySrc = src || getFallbackImageUrl();

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(filename);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`relative ${thumbClass} shrink-0 overflow-hidden rounded-xl border-4 border-amber-300 bg-green-100 shadow-md`}
      onMouseEnter={() => onHoverMainImage?.(displaySrc)}
      onMouseLeave={() => onHoverMainImage?.(null)}
    >
      {src ? (
        <CachedImage
          src={displaySrc}
          alt={filename}
          width={thumbWidth}
          height={thumbHeight}
          className="h-full w-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500 rounded-xl">
          —
        </div>
      )}
      {/* Overlay is pointer-events-none so hover on the container still fires; only the × button captures clicks */}
      {src && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            type="button"
            title={`Delete ${filename}`}
            disabled={busy}
            onClick={handleDelete}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/20 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <svg viewBox="0 0 12 12" className="h-4 w-4 text-red-500 drop-shadow" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Media mode empty slot with + upload button ───────────────────────────────

function EtcEmptySlot({
  targetFilename,
  thumbClass,
  onUpload,
}: {
  targetFilename: string;
  thumbClass: string;
  onUpload: (filename: string, file: File) => Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBusy(true);
    try {
      await onUpload(targetFilename, file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileChosen}
      />
      <button
        type="button"
        title={`Upload image as ${targetFilename}`}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`${thumbClass} shrink-0 overflow-hidden rounded-xl border-4 border-dashed border-amber-300 bg-amber-50/60 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400`}
      >
        <div className="flex h-full w-full items-center justify-center">
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </div>
      </button>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdditionalImagesStrip({
  product,
  onSetMainImage,
  onHoverMainImage,
  onOpenLightbox,
  compact = false,
  manageMediaMode = false,
  onMediaDelete,
  onMediaUpload,
  deletedFilenames,
  uploadedFilenames,
}: AdditionalImagesStripProps) {
  const filenames = React.useMemo(
    () => getAdditionalImageFilenames(product),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.itmGroupName]
  );
  const slots = React.useMemo(
    () => padToMinSlots(filenames, MIN_IMAGE_HOLDERS),
    [filenames]
  );
  const hasProduct = product != null;
  const thumb = compact ? COMPACT_THUMB : DEFAULT_THUMB;
  const rowStyle = compact
    ? "flex min-w-0 shrink-0 bg-transparent p-2 h-16"
    : "flex min-w-0 shrink-0 border-t border-green-200 bg-green-50 p-2 h-24";

  const handleDeleteEtc = React.useCallback(
    async (filename: string) => {
      if (onMediaDelete) await onMediaDelete("Items", filename);
    },
    [onMediaDelete]
  );

  const handleUploadEtc = React.useCallback(
    async (filename: string, file: File) => {
      if (onMediaUpload) await onMediaUpload("Items", filename, file);
    },
    [onMediaUpload]
  );

  // ── Media management mode ────────────────────────────────────────────────
  if (manageMediaMode && hasProduct) {
    // All 25 slot filenames for this product (main + 24 extras)
    const allSlotFilenames = getAdditionalImageFilenames(product, MEDIA_SLOT_COUNT);
    // Merge: convention filenames + layout-level uploaded, minus layout-level deleted
    const existingSet = new Set(
      [...filenames, ...(uploadedFilenames ?? [])].filter((f) => !(deletedFilenames ?? new Set()).has(f))
    );

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
          <div className="flex h-full min-w-full justify-center">
            <div className="flex h-full w-max min-h-full items-center gap-1.5 py-1">
              {allSlotFilenames.map((filename) =>
                existingSet.has(filename) ? (
                  <EtcMediaThumb
                    key={filename}
                    filename={filename}
                    thumbWidth={thumb.width}
                    thumbHeight={thumb.height}
                    thumbClass={thumb.class}
                    onDelete={handleDeleteEtc}
                    onHoverMainImage={onHoverMainImage}
                  />
                ) : (
                  <EtcEmptySlot
                    key={filename}
                    targetFilename={filename}
                    thumbClass={thumb.class}
                    onUpload={handleUploadEtc}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal mode ──────────────────────────────────────────────────────────
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
        <div className="flex h-full min-w-full justify-center">
          <div className="flex h-full w-max min-h-full items-center gap-1.5 py-1">
            {(hasProduct ? slots : Array(MIN_IMAGE_HOLDERS).fill(null)).map((filename, index) => {
              if (filename === null) {
                return (
                  <div
                    key={`placeholder-${index}`}
                    aria-hidden
                    className={`${thumb.class} shrink-0 overflow-hidden rounded-xl border-4 border-green-200 bg-green-100`}
                  />
                );
              }
              const src = getImageUrl(filename);
              const displaySrc = src || getFallbackImageUrl();
              return (
                <button
                  key={filename}
                  type="button"
                  className={`${thumb.class} shrink-0 overflow-hidden rounded-xl border-4 border-green-200 bg-green-100 shadow-md transition-all duration-200 hover:shadow-lg hover:border-green-200 hover:bg-green-100 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1`}
                  title="Click for full size"
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
                    <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500 rounded-xl">
                      —
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
