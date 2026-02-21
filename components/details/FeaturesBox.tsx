"use client";

/**
 * Features box under product info: parses product EY (split by ::), looks up each segment
 * in the features table (col A = key), shows col B (label). Col C (url): when present, clicking
 * the feature shows that media in the main viewer (image or video).
 */

import React from "react";
import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import { getFeatureMediaUrl } from "@/lib/r2ImageHelper";

const EY_SEPARATOR = "::";

export interface FeatureMatch {
  label: string;
  /** Full CDN URL when feature has col C (url); used to show image or play video in main viewer. */
  mediaUrl: string | null;
}

interface FeaturesBoxProps {
  product: Product | null;
  features: FeatureRecord[];
  /** Called when user clicks a feature that has a url (col C). Parent shows image or video in main area. */
  onFeatureMediaClick?: (mediaUrl: string) => void;
}

function getFeatureMatchesForProductEy(
  ey: string | undefined,
  features: FeatureRecord[]
): FeatureMatch[] {
  if (!ey || !ey.trim()) return [];
  const byKey = new Map(features.map((f) => [f.key.trim(), f]));
  const byKeyLower = new Map(features.map((f) => [f.key.trim().toLowerCase(), f]));
  const segments = ey.split(EY_SEPARATOR).map((s) => s.trim()).filter(Boolean);
  const out: FeatureMatch[] = [];
  for (const seg of segments) {
    const f = byKey.get(seg) ?? byKeyLower.get(seg.toLowerCase());
    if (f?.label) {
      const mediaUrl = f.url?.trim() ? getFeatureMediaUrl(f.url) : null;
      out.push({ label: f.label, mediaUrl: mediaUrl || null });
    }
  }
  return out;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|ogg|m4v|avi|mn4)(\?|$)/i;

export function isVideoMediaUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url);
}

/** Right-end icon: image, video, or description-only. */
function FeatureMediaTypeIcon({
  mediaUrl,
  className = "size-5 shrink-0 opacity-90",
}: {
  mediaUrl: string | null;
  className?: string;
}) {
  if (mediaUrl) {
    if (isVideoMediaUrl(mediaUrl)) {
      return (
        <span className={className} title="Video" aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
        </span>
      );
    }
    return (
      <span className={className} title="Image" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-full">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </span>
    );
  }
  return (
    <span className={className} title="Description only" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-full">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    </span>
  );
}

export default function FeaturesBox({ product, features, onFeatureMediaClick }: FeaturesBoxProps) {
  if (!product) return null;

  const matches = getFeatureMatchesForProductEy(product.ey, features);
  const hasEy = product.ey != null && product.ey.trim() !== "";

  // Hide the box when product has no EY (no features listed for this product).
  if (matches.length === 0 && !hasEy) return null;

  return (
    <div
      id="divFeaturesBox"
      className="mt-4 rounded-lg border border-green-200 bg-white p-3"
    >
      <h3 id="h3FeaturesTitle" className="mb-2 text-sm font-semibold text-slate-800">
        Features
      </h3>
      {matches.length > 0 ? (
        <ul id="ulFeaturesList" className="flex flex-col gap-1.5 text-sm">
          {matches.map((m, i) => (
            <li key={`${i}-${m.label.slice(0, 20)}`} id={`liFeature-${i}`}>
              {m.mediaUrl && onFeatureMediaClick ? (
                <button
                  type="button"
                  id={`btnFeature-${i}`}
                  onClick={() => onFeatureMediaClick(m.mediaUrl!)}
                  className="flex w-full items-center gap-2 rounded bg-teal-600 px-2 py-1.5 text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  title={isVideoMediaUrl(m.mediaUrl) ? "Play video in main viewer" : "Show in main image"}
                >
                  <img
                    src="/used/star.jpg"
                    alt=""
                    className="size-5 shrink-0 object-contain"
                    width={20}
                    height={20}
                  />
                  <span className="min-w-0 flex-1 text-left font-medium text-white">{m.label}</span>
                  <FeatureMediaTypeIcon mediaUrl={m.mediaUrl} />
                </button>
              ) : (
                <div className="flex w-full items-center gap-2 rounded bg-teal-600 px-2 py-1.5 text-white shadow-sm">
                  <img
                    src="/used/star.jpg"
                    alt=""
                    className="size-5 shrink-0 object-contain"
                    width={20}
                    height={20}
                  />
                  <span className="min-w-0 flex-1 font-medium text-white">{m.label}</span>
                  <FeatureMediaTypeIcon mediaUrl={null} />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p id="pFeaturesEmpty" className="text-sm text-slate-500">
          {!hasEy
            ? "No features listed for this product."
            : "No matching features. Check EY column and Features sheet (NEXT_PUBLIC_FEATURES_GID)."}
        </p>
      )}
    </div>
  );
}
