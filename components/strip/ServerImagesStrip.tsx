"use client";

/**
 * Horizontal strip of server images (ForAll or ForGroup) with compact thumbs.
 * In normal mode shows filenames as thumbs (padded to minSlots).
 * In media mode shows exactly MEDIA_SLOT_COUNT fixed slots: filled slots get ×, empty slots get +.
 */

import React from "react";
import { getImageUrlForFolder } from "@/lib/r2ImageHelper";
import type { BarImageFolder } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";
import { SETTINGS } from "@/lib/settings";

const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 48;
const THUMB_CLASS = "h-12 w-16";

/** Fixed number of slots shown in media management mode. */
const MEDIA_SLOT_COUNT = 25;

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
  /** When true, renders in media management mode: fixed 25 slots, × on filled, + on empty. */
  manageMediaMode?: boolean;
  /** Called when admin deletes an image in media mode. */
  onMediaDelete?: (folder: BarImageFolder, filename: string) => Promise<void>;
  /** Called when admin picks a file to upload in media mode. */
  onMediaUpload?: (folder: BarImageFolder, file: File) => Promise<void>;
}

// ─── Normal mode thumb ────────────────────────────────────────────────────────

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

// ─── Media mode slot ──────────────────────────────────────────────────────────

function MediaSlot({
  filename,
  folder,
  onDelete,
  onUpload,
  onHoverMainImage,
}: {
  filename: string | null;
  folder: BarImageFolder;
  onDelete: (filename: string) => void;
  onUpload: () => void;
  onHoverMainImage?: (url: string | null) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [localHidden, setLocalHidden] = React.useState(false);
  const hiddenFilenameRef = React.useRef<string | null>(null);

  // Only reset localHidden when a genuinely different filename occupies this slot.
  // Using a ref to track which filename was hidden prevents re-showing the same
  // deleted file when the parent re-renders and passes the same filename again.
  React.useEffect(() => {
    if (filename !== null && filename !== hiddenFilenameRef.current) {
      setLocalHidden(false);
    }
  }, [filename]);

  const isFilled = filename !== null && !localHidden;
  const src = isFilled ? getImageUrlForFolder(filename!, folder) : null;
  const displaySrc = src || SETTINGS.fallbackImagePath;

  const handleDelete = async () => {
    if (!filename || busy) return;
    setBusy(true);
    // Record which filename is being hidden so the effect doesn't reset it on re-render
    hiddenFilenameRef.current = filename;
    setLocalHidden(true);
    try {
      await onDelete(filename);
    } catch {
      // If delete fails, clear the ref and restore visibility
      hiddenFilenameRef.current = null;
      setLocalHidden(false);
    } finally {
      setBusy(false);
    }
  };

  if (isFilled) {
    return (
      <div
        className={`relative ${THUMB_CLASS} shrink-0 overflow-hidden rounded-xl border-4 border-amber-300 bg-green-100 shadow-md`}
        onMouseEnter={() => onHoverMainImage?.(displaySrc)}
        onMouseLeave={() => onHoverMainImage?.(null)}
      >
        <CachedImage
          src={displaySrc}
          alt={filename!}
          width={THUMB_WIDTH}
          height={THUMB_HEIGHT}
          className="h-full w-full object-cover pointer-events-none"
        />
        {/* Overlay is pointer-events-none so hover on the container still fires; only the × button captures clicks */}
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
      </div>
    );
  }

  return (
    <button
      type="button"
      title="Upload image"
      disabled={busy}
      onClick={onUpload}
      className={`${THUMB_CLASS} shrink-0 overflow-hidden rounded-xl border-4 border-dashed border-amber-300 bg-amber-50/60 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400`}
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
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  manageMediaMode = false,
  onMediaDelete,
  onMediaUpload,
}: ServerImagesStripProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadBusy, setUploadBusy] = React.useState(false);

  const wrapperClass = noTopBorder
    ? "flex h-16 min-w-0 shrink-0 overflow-hidden bg-transparent p-2"
    : "flex h-16 min-w-0 shrink-0 overflow-hidden border-t border-green-100 bg-green-50/80 p-2";

  // ── Media management mode ────────────────────────────────────────────────
  if (manageMediaMode) {
    // Build exactly MEDIA_SLOT_COUNT slots: filled first, then empty
    const filled = filenames.slice(0, MEDIA_SLOT_COUNT);
    const emptyCount = Math.max(0, MEDIA_SLOT_COUNT - filled.length);
    const slots: (string | null)[] = [...filled, ...Array(emptyCount).fill(null)];

    const handleDeleteSlot = async (filename: string) => {
      if (!onMediaDelete) return;
      await onMediaDelete(folder, filename);
    };

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onMediaUpload) return;
      e.target.value = "";
      setUploadBusy(true);
      try {
        await onMediaUpload(folder, file);
      } finally {
        setUploadBusy(false);
      }
    };

    return (
      <div className={wrapperClass} aria-label={ariaLabel}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          onChange={handleFileChosen}
        />
        <div
          className="horizontal-scroll size-full min-w-0 overflow-x-scroll"
          style={{ width: "100%", maxWidth: "100%" }}
          role="region"
          aria-label={ariaLabel}
        >
          <div className={`flex h-full w-max min-h-full items-center gap-1.5 py-1 ${centerAlign ? "min-w-full justify-center" : ""}`}>
            {slots.map((filename, index) => (
              <MediaSlot
                key={filename ?? `empty-${index}`}
                filename={filename}
                folder={folder}
                onDelete={handleDeleteSlot}
                onUpload={handleUploadClick}
                onHoverMainImage={onHoverMainImage}
              />
            ))}
          </div>
        </div>
        {uploadBusy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
          </div>
        )}
      </div>
    );
  }

  // ── Normal mode ─────────────────────────────────────────────────────────
  const slots = minSlots != null ? padToMinSlots(filenames, minSlots) : filenames;
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
    <div className={wrapperClass} aria-label={ariaLabel}>
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
