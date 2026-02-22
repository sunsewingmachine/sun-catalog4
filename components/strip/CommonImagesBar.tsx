"use client";

/**
 * Full-width bottom bar. When purpose is "flash", shows rotating display messages (from settings) with 5s interval and smooth animation.
 * When purpose is "images", shows ForAll then ForGroup thumbs (legacy; images now shown in 3-row area below main).
 */

import React, { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { getImageUrlForFolder } from "@/lib/r2ImageHelper";
import Image from "next/image";
import CachedImage from "@/components/shared/CachedImage";
import { SETTINGS } from "@/lib/settings";

/** Disclaimer text shown in the bottom bar (compact). */
const DISCLAIMER_TEXT =
  "படத்தில் உள்ளவைகள் சேம்பிள் மட்டுமே. பொருட்களின் கலர்,\nஅளவு, லேபிள்கள், விலை என அனைத்தும் மாற்றத்திற்கு\nஉரியது. GST Applicable. Cover, Scissor Extra.";

/** Duration for current message to fade out (ms). */
const FLASH_FADE_OUT_MS = 3000;
/** Duration for new message to fade in (ms). */
const FLASH_FADE_IN_MS = 3000;
const FLASH_TOTAL_TRANSITION_MS = FLASH_FADE_OUT_MS + FLASH_FADE_IN_MS;

/** Icon before flash message: uses announce.png from public; falls back to megaphone SVG if image missing. */
function AnnounceIcon({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={className} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-teal-100">
          <path d="M3 11l18-5v12L3 14v-3z" />
          <path d="M11 6v12" />
          <path d="M18 6v3" />
        </svg>
      </span>
    );
  }
  return (
    <img
      src="/announce.png"
      alt=""
      className={className}
      aria-hidden
      onError={() => setFailed(true)}
    />
  );
}

/** Format ISO date as dd/mm/yy hh:mm:ss AM/PM for bottom bar and sidebar. */
export function formatLastUpdated(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = String(h % 12 || 12).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}:${ss} ${ampm}`;
}

/** Bottom bar that cycles through display messages one-by-one with fade-out then fade-in. */
function FlashMessageBar({
  messages,
  intervalMs,
  lastUpdated,
  dbVersion,
  appVersion,
}: {
  messages: readonly string[];
  intervalMs: number;
  lastUpdated: string | null;
  dbVersion: string;
  appVersion: string;
}) {
  const labelWidth = "5.5rem";
  const versionBlock = (
    <div
      id="divBottomBarVersion"
      className="shrink-0 text-[10px] leading-tight text-teal-100"
      aria-label="Database, app version and last updated"
      title="Database and app version, catalog last updated"
    >
      <div><span className="inline-block text-left" style={{ width: labelWidth }}>DbVersion</span>: {dbVersion || "—"}</div>
      <div><span className="inline-block text-left" style={{ width: labelWidth }}>AppVersion</span>: {appVersion || "—"}</div>
      <div><span className="inline-block text-left" style={{ width: labelWidth }}>Last updated</span>: {lastUpdated ? formatLastUpdated(lastUpdated) : "—"}</div>
    </div>
  );
  const length = messages.length;
  const [currentIndex, setCurrentIndex] = useState(() =>
    length > 0 ? Math.floor(Math.random() * length) : 0
  );
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  /** When true, fade-out is done; incoming message is fading in over FLASH_FADE_IN_MS. */
  const [fadeOutComplete, setFadeOutComplete] = useState(false);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => {
      const next = (currentIndexRef.current + 1) % length;
      setNextIndex(next);
      setFadeOutComplete(false);
      setIsTransitioning(true);
    }, intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);

  useEffect(() => {
    if (!isTransitioning || nextIndex === null) return;
    const t1 = setTimeout(() => setFadeOutComplete(true), FLASH_FADE_OUT_MS);
    const t2 = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setNextIndex(null);
      setIsTransitioning(false);
      setFadeOutComplete(false);
    }, FLASH_TOTAL_TRANSITION_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isTransitioning, nextIndex]);

  const showTwoLayers = isTransitioning && nextIndex !== null;
  const incomingIndex = nextIndex ?? 0;

  const disclaimerBlock = (
    <div id="divBottomBarDisclaimer" className="shrink-0 max-w-[42%] min-w-0" aria-live="polite">
      <div className="flex items-center gap-1 rounded border border-teal-500 bg-teal-700/90 px-1.5 py-1">
        <img
          src="/used/info.png"
          alt=""
          className="size-5 shrink-0 object-contain self-center"
          width={20}
          height={20}
        />
        <p id="pDisclaimerText" className="min-w-0 flex-1 text-[10px] leading-tight text-white whitespace-pre-line">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );

  if (length === 0) {
    return (
      <footer
        id="divCommonImagesBar"
        className="flex h-14 min-w-0 shrink-0 items-center gap-3 overflow-hidden border-t border-teal-600 bg-teal-600 px-3 py-0.5"
        aria-label="Flash messages"
      >
        {versionBlock}
        <div className="min-w-0 flex-1" role="region" aria-live="polite" />
        {disclaimerBlock}
      </footer>
    );
  }

  const messageContent = (msg: string) => (
    <>
      <AnnounceIcon className="mr-2 h-16 w-16 shrink-0" />
      <span className="min-w-0 truncate">{msg}</span>
    </>
  );

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-14 min-w-0 shrink-0 items-center gap-3 overflow-hidden border-t border-teal-600 bg-teal-600 px-3 py-1"
      aria-label="Flash messages"
    >
      {versionBlock}
      <div
        className="relative flex min-w-0 flex-1 items-center justify-center"
        role="region"
        aria-live="polite"
        aria-atomic="true"
      >
        {showTwoLayers ? (
          <>
            <div
              className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white transition-opacity ease-out"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transitionDuration: `${FLASH_FADE_OUT_MS}ms`,
              }}
              aria-hidden
            >
              {messageContent(messages[currentIndex])}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-center text-lg font-semibold text-white transition-opacity ease-out"
              style={{
                opacity: fadeOutComplete ? 1 : 0,
                transitionDuration: `${FLASH_FADE_IN_MS}ms`,
              }}
            >
              {messageContent(messages[incomingIndex])}
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-center text-lg font-semibold text-white">
            {messageContent(messages[currentIndex])}
          </div>
        )}
      </div>
      {disclaimerBlock}
    </footer>
  );
}

/** Derives category prefix from itmGroupName (e.g. "Sv.Happy.1st" → "Sv"). Used to filter ForGroup images. */
function getCategoryPrefix(itmGroupName: string): string {
  if (!itmGroupName) return "";
  const dot = itmGroupName.indexOf(".");
  return dot >= 0 ? itmGroupName.slice(0, dot) : itmGroupName;
}

interface CommonImagesBarProps {
  /** "flash" = reserve bar for flash messages only (no images). "images" = show ForAll/ForGroup thumbs (legacy). */
  purpose?: "flash" | "images";
  /** Catalog last-updated ISO string; when set, shown on the left of the bottom bar (flash purpose only). */
  lastUpdated?: string | null;
  /** Database version (e.g. from Sheets B1); shown in bottom bar when purpose is "flash". */
  dbVersion?: string;
  /** App version (e.g. 1.0); shown in bottom bar when purpose is "flash". */
  appVersion?: string;
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
  /** Single-click opens full-size zoomable lightbox (when purpose is "images"). */
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
      className="h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-teal-500 bg-white shadow-sm cursor-pointer"
      title="Click for full size; double-click to show in main"
      onClick={(e) => {
        e.preventDefault();
        onOpenLightbox?.(displaySrc, filename);
      }}
      onDoubleClick={() => onSetMainImage?.(displaySrc)}
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
        <div className="flex h-full w-full items-center justify-center bg-teal-100 text-[10px] text-slate-500">
          —
        </div>
      )}
    </button>
  );
}

export default function CommonImagesBar({
  purpose = "flash",
  lastUpdated = null,
  dbVersion,
  appVersion,
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
      <FlashMessageBar
        messages={SETTINGS.displayMessages}
        intervalMs={SETTINGS.bottomBarMessageIntervalMs}
        lastUpdated={lastUpdated ?? null}
        dbVersion={dbVersion ?? ""}
        appVersion={appVersion ?? ""}
      />
    );
  }

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-16 min-w-0 shrink-0 items-center overflow-hidden border-t border-teal-600 bg-teal-600 px-2 py-0.5"
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
                className="h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-teal-500 bg-white shadow-sm cursor-pointer"
                title="Default image. Click for full size; double-click to show in main."
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLightbox?.(SETTINGS.fallbackImagePath, "Default");
                }}
                onDoubleClick={() => onSetMainImage?.(SETTINGS.fallbackImagePath)}
              >
                <Image
                  src={SETTINGS.fallbackImagePath}
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
                const displaySrc = src || SETTINGS.fallbackImagePath;
                return renderBarThumb(filename, src, displaySrc, onSetMainImage, onOpenLightbox);
              })}
              {forGroupFiltered.map((filename) => {
                const src = getImageUrlForFolder(filename, "ForGroup");
                const displaySrc = src || SETTINGS.fallbackImagePath;
                return renderBarThumb(filename, src, displaySrc, onSetMainImage, onOpenLightbox);
              })}
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
