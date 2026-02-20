"use client";

/**
 * Main product image and thumbnail strip. One image for now: {ItmGroupName} (1).jpg
 */

import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import Image from "next/image";

interface ProductViewerProps {
  product: Product | null;
}

export default function ProductViewer({ product }: ProductViewerProps) {
  if (!product) {
    return (
      <div
        id="divMainImage"
        className="flex h-full items-center justify-center rounded-2xl bg-white/90 text-slate-500 shadow-sm"
      >
        Select a product
      </div>
    );
  }
  const src = getImageUrl(product.imageFilename);
  return (
    <div id="divProductViewer" className="flex h-full flex-col">
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl bg-white/90 shadow-sm">
        {src ? (
          <Image
            id="imgMainProduct"
            src={src}
            alt={product.itmGroupName}
            fill
            className="object-contain"
            sizes="(max-width: 800px) 100vw, 50vw"
            unoptimized={src.startsWith("http")}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            No image
          </div>
        )}
      </div>
      <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
          {src && (
            <Image
              src={src}
              alt={`${product.itmGroupName} thumb`}
              width={80}
              height={64}
              className="h-full w-full object-cover"
              unoptimized={src.startsWith("http")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
