"use client";

/**
 * Full-screen lightbox for a single image. Double-click any catalog image to open.
 * Supports zoom (mouse wheel / pinch) and pan (drag) to inspect any area.
 * Renders via portal to document.body so closing it restores the main view without stacking-context or focus side effects.
 */

import React from "react";
import { createPortal } from "react-dom";
import { SETTINGS } from "@/lib/settings";

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const WHEEL_ZOOM_FACTOR = 0.002;

interface ImageLightboxProps {
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}

/** Default aspect ratio when image dimensions are unknown (e.g. 1920×1080). */
const DEFAULT_ASPECT_RATIO = 1920 / 1080;

export default function ImageLightbox({
  imageSrc,
  imageAlt,
  onClose,
}: ImageLightboxProps) {
  const [scale, setScale] = React.useState(1);
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  /** Image natural dimensions so the lightbox box can match and show image exactly. */
  const [aspectRatio, setAspectRatio] = React.useState(DEFAULT_ASPECT_RATIO);
  const dragStart = React.useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  const unoptimized =
    imageSrc.startsWith("http") ||
    imageSrc.startsWith("blob:") ||
    imageSrc === SETTINGS.fallbackImagePath;

  const handleImageLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const w = img.naturalWidth || 1920;
      const h = img.naturalHeight || 1080;
      if (w > 0 && h > 0) setAspectRatio(w / h);
    },
    []
  );

  const clampScale = (s: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      setScale((prev) => clampScale(prev + prev * delta));
    },
    []
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    },
    [translate.x, translate.y]
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setTranslate({
        x: dragStart.current.tx + e.clientX - dragStart.current.x,
        y: dragStart.current.ty + e.clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClose = React.useCallback(() => {
    previousActiveElement.current?.focus?.();
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  React.useEffect(() => {
    setAspectRatio(DEFAULT_ASPECT_RATIO);
  }, [imageSrc]);

  React.useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previousActiveElement.current?.focus?.();
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const lightboxContent = (
    <div
      id="divImageLightboxBackdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Image full size view"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={handleBackdropClick}
    >
      {/* Exit fullscreen strip on the left (like sidebar) */}
      <div
        id="divLightboxExitFullscreenStrip"
        className="absolute left-0 top-0 z-10 flex h-full w-14 flex-col justify-end border-r border-white/20 bg-black/40 p-1"
        aria-label="Exit fullscreen"
      >
        <button
          type="button"
          id="btnLightboxExitFullscreen"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex w-full items-center justify-center gap-1 rounded border-t border-white/20 p-2 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
          title="Exit fullscreen (Esc)"
          aria-label="Exit fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden>
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
          <span className="text-xs font-medium">/ exit fullscreen</span>
        </button>
      </div>
      <button
        type="button"
        id="btnLightboxClose"
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-white/30"
      >
        Close
      </button>
      <p className="absolute bottom-4 left-[4.5rem] z-10 text-xs text-white/80">
        Scroll to zoom, drag to pan
      </p>
      <div
        ref={containerRef}
        className="flex h-full w-full cursor-grab active:cursor-grabbing items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        style={{ touchAction: "none" }}
      >
        <div
          className="flex shrink-0 items-center justify-center transition-transform duration-100"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            width: `min(90vw, calc(90vh * ${aspectRatio}))`,
            height: `min(90vh, calc(90vw / ${aspectRatio}))`,
          }}
        >
          <img
            id="imgLightboxImage"
            src={imageSrc || SETTINGS.fallbackImagePath}
            alt={imageAlt}
            className="h-full w-full select-none object-contain"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onLoad={handleImageLoad}
          />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(lightboxContent, document.body);
}
