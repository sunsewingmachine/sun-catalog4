"use client";

/**
 * Main product image and thumbnail strip. One image for now: {ItmGroupName} (1).jpg
 * Temporarily shows public/machines sample when no product image is available or when image fails to load.
 */

import React from "react";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";
import Image from "next/image";

/** Temporary sample image from public/machines; remove when real images are wired. */
const TEMP_SAMPLE_IMAGE = "/machines/Sample.jpg";

interface ProductViewerProps {
  product: Product | null;
}

export default function ProductViewer({ product }: ProductViewerProps) {
  const [mainImageError, setMainImageError] = React.useState(false);
  const displaySrc = product ? getImageUrl(product.imageFilename) : "";
  const useSample = !displaySrc || mainImageError;
  const mainSrc = useSample ? TEMP_SAMPLE_IMAGE : displaySrc;

  React.useEffect(() => {
    setMainImageError(false);
  }, [product?.itmGroupName, displaySrc]);

  if (!product) {
    return (
      <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/90 shadow-sm">
          <Image
            id="imgMainProduct"
            src={TEMP_SAMPLE_IMAGE}
            alt="Sample"
            fill
            className="object-contain"
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
      </div>
    );
  }

  return (
    <div id="divProductViewer" className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/90 shadow-sm">
        <Image
          id="imgMainProduct"
          src={mainSrc}
          alt={product.itmGroupName}
          fill
          className="object-contain"
          sizes="(max-width: 800px) 100vw, 50vw"
          unoptimized={mainSrc.startsWith("http") || mainSrc === TEMP_SAMPLE_IMAGE}
          onError={() => setMainImageError(true)}
        />
      </div>
      <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
          <Image
            src={displaySrc || TEMP_SAMPLE_IMAGE}
            alt={`${product.itmGroupName} thumb`}
            width={80}
            height={64}
            className="h-full w-full object-cover"
            unoptimized={displaySrc ? displaySrc.startsWith("http") : false}
          />
        </div>
      </div>
    </div>
  );
}
