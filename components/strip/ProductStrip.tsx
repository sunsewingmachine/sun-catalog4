"use client";

/**
 * Bottom horizontal strip of product thumbnails; uses cached images when available.
 * Tries exact-case URL first (matches R2), then lowercase on 404.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import CachedImage from "@/components/shared/CachedImage";
import { SETTINGS } from "@/lib/settings";

interface ProductStripProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
  /** Double-click image opens full-size zoomable lightbox. */
  onOpenLightbox?: (imageSrc: string, imageAlt: string) => void;
}

export default function ProductStrip({
  products,
  selected,
  onSelect,
  onOpenLightbox,
}: ProductStripProps) {
  const [useLowercaseFor, setUseLowercaseFor] = React.useState<Set<string>>(() => new Set());

  return (
    <div
      id="divProductStripScroll"
      className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
    >
      {products.slice(0, 50).map((p, index) => {
        const useLower = useLowercaseFor.has(p.itmGroupName);
        const src = getImageUrl(p.imageFilename, useLower);
        const isSelected = selected?.itmGroupName === p.itmGroupName;
        const displaySrc = src || SETTINGS.fallbackImagePath;
        return (
          <button
            key={`${p.itmGroupName}-${index}`}
            type="button"
            onClick={() => onSelect(p)}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (displaySrc) onOpenLightbox?.(displaySrc, p.itmGroupName);
            }}
            className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
              isSelected ? "border-teal-600 ring-2 ring-teal-500/20" : "border-green-200 hover:border-green-300"
            }`}
          >
            {src ? (
              <CachedImage
                src={displaySrc}
                alt={p.itmGroupName}
                width={80}
                height={64}
                className="h-full w-full object-cover pointer-events-none"
                onError={
                  useLower
                    ? undefined
                    : () => setUseLowercaseFor((prev) => new Set(prev).add(p.itmGroupName))
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-green-100 text-xs text-slate-500">
                —
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
