"use client";

/**
 * Bottom horizontal strip of product thumbnails; click to select product.
 */

import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import Image from "next/image";

interface ProductStripProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
}

export default function ProductStrip({
  products,
  selected,
  onSelect,
}: ProductStripProps) {
  return (
    <div
      id="divProductStripScroll"
      className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
    >
      {products.slice(0, 50).map((p) => {
        const src = getImageUrl(p.imageFilename);
        const isSelected = selected?.itmGroupName === p.itmGroupName;
        return (
          <button
            key={p.itmGroupName}
            type="button"
            onClick={() => onSelect(p)}
            className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
              isSelected ? "border-teal-600 ring-2 ring-teal-500/20" : "border-green-200 hover:border-green-300"
            }`}
          >
            {src ? (
              <Image
                src={src}
                alt={p.itmGroupName}
                width={80}
                height={64}
                className="h-full w-full object-cover"
                unoptimized={src.startsWith("http")}
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
