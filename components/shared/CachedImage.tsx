"use client";

/**
 * Renders an image using cache-first display URL (IndexedDB). Use for CDN images in strip/viewer/common bar.
 */

import React from "react";
import Image from "next/image";
import { useImageDisplayUrl } from "@/hooks/useImageDisplayUrl";
import { SETTINGS } from "@/lib/settings";

export interface CachedImageProps
  extends Omit<
    React.ComponentPropsWithoutRef<"img">,
    "src" | "width" | "height"
  > {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  /** Use Next Image for non-http/blob (e.g. fallback image). */
  useNextImageForLocal?: boolean;
}

export default function CachedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  useNextImageForLocal = true,
  className,
  ...rest
}: CachedImageProps) {
  const isRemote = src.startsWith("http") || src.startsWith("blob:");
  const { displayUrl, isReady } = useImageDisplayUrl(
    isRemote ? src : ""
  );
  const effectiveSrc = isRemote ? (displayUrl || src) : src;
  const showAsImg =
    effectiveSrc.startsWith("http") ||
    effectiveSrc.startsWith("blob:") ||
    !useNextImageForLocal;

  if (showAsImg) {
    return (
      <img
        src={effectiveSrc || SETTINGS.fallbackImagePath}
        alt={alt}
        width={width}
        height={height}
        className={className}
        referrerPolicy="no-referrer"
        draggable={false}
        {...rest}
      />
    );
  }
  if (fill) {
    return (
      <Image
        src={effectiveSrc || SETTINGS.fallbackImagePath}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        draggable={false}
        {...rest}
      />
    );
  }
  return (
    <Image
      src={effectiveSrc || SETTINGS.fallbackImagePath}
      alt={alt}
      width={width ?? 80}
      height={height ?? 64}
      className={className}
      draggable={false}
      {...rest}
    />
  );
}
