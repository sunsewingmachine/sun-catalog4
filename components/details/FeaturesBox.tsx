"use client";

/**
 * Features box under product info: parses product EY (split by ::), looks up each segment
 * in the features table (col A = key), shows col B (label) for matching records.
 */

import React from "react";
import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";

const EY_SEPARATOR = "::";

interface FeaturesBoxProps {
  product: Product | null;
  features: FeatureRecord[];
}

function getLabelsForProductEy(ey: string | undefined, features: FeatureRecord[]): string[] {
  if (!ey || !ey.trim()) return [];
  const byKey = new Map(features.map((f) => [f.key.trim(), f.label]));
  const byKeyLower = new Map(features.map((f) => [f.key.trim().toLowerCase(), f.label]));
  const segments = ey.split(EY_SEPARATOR).map((s) => s.trim()).filter(Boolean);
  const labels: string[] = [];
  for (const seg of segments) {
    const label = byKey.get(seg) ?? byKeyLower.get(seg.toLowerCase());
    if (label) labels.push(label);
  }
  return labels;
}

export default function FeaturesBox({ product, features }: FeaturesBoxProps) {
  if (!product) return null;

  const labels = getLabelsForProductEy(product.ey, features);
  const hasEy = product.ey != null && product.ey.trim() !== "";

  return (
    <div
      id="divFeaturesBox"
      className="mt-4 rounded-lg border border-green-200 bg-green-50/80 p-3"
    >
      <h3 id="h3FeaturesTitle" className="mb-2 text-sm font-semibold text-slate-800">
        Features
      </h3>
      {labels.length > 0 ? (
        <ul id="ulFeaturesList" className="list-inside list-disc space-y-1 text-sm text-slate-700">
          {labels.map((label, i) => (
            <li key={`${i}-${label.slice(0, 20)}`} id={`liFeature-${i}`}>
              {label}
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
