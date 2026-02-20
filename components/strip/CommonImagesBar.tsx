"use client";

/**
 * Full-width bottom bar showing images that appear in more than one product (common/shared).
 * Height and padding match the top header bar for visual consistency.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import Image from "next/image";

interface CommonImagesBarProps {
  products: Product[];
}

function getCommonImageFilenames(products: Product[]): string[] {
  const countByFile: Record<string, number> = {};
  for (const p of products) {
    if (!p.imageFilename) continue;
    countByFile[p.imageFilename] = (countByFile[p.imageFilename] ?? 0) + 1;
  }
  return Object.entries(countByFile)
    .filter(([, count]) => count > 1)
    .map(([filename]) => filename)
    .slice(0, 50);
}

export default function CommonImagesBar({ products }: CommonImagesBarProps) {
  const commonFilenames = React.useMemo(
    () => getCommonImageFilenames(products),
    [products]
  );

  return (
    <footer
      id="divCommonImagesBar"
      className="flex h-14 shrink-0 items-center border-t border-green-200 bg-green-200 px-5 py-3 shadow-sm"
      aria-label="Common images"
    >
      <div className="scrollbar-hide flex flex-1 items-center gap-2 overflow-x-auto">
        {commonFilenames.length === 0 ? (
          <span className="text-sm text-slate-500">
            No images shared across multiple products
          </span>
        ) : (
          commonFilenames.map((filename) => {
            const src = getImageUrl(filename);
            return (
              <div
                key={filename}
                className="h-8 w-10 shrink-0 overflow-hidden rounded-lg border border-green-300 bg-white shadow-sm"
              >
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    width={40}
                    height={32}
                    className="h-full w-full object-cover"
                    unoptimized={src.startsWith("http")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-green-100 text-[10px] text-slate-400">
                    —
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </footer>
  );
}
