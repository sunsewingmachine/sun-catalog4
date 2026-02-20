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
      className="flex gap-2 overflow-x-auto pb-2"
    >
      {products.slice(0, 50).map((p) => {
        const src = getImageUrl(p.imageFilename);
        const isSelected = selected?.itmGroupName === p.itmGroupName;
        return (
          <button
            key={p.itmGroupName}
            type="button"
            onClick={() => onSelect(p)}
            className={`h-16 w-20 shrink-0 overflow-hidden rounded border-2 transition-colors ${
              isSelected ? "border-blue-600" : "border-zinc-200 hover:border-zinc-300"
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
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400">
                —
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
