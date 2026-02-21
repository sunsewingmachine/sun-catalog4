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
  const segments = ey.split(EY_SEPARATOR).map((s) => s.trim()).filter(Boolean);
  const labels: string[] = [];
  for (const seg of segments) {
    const label = byKey.get(seg);
    if (label) labels.push(label);
  }
  return labels;
}

export default function FeaturesBox({ product, features }: FeaturesBoxProps) {
  const labels = product ? getLabelsForProductEy(product.ey, features) : [];
  if (labels.length === 0) return null;

  return (
    <div
      id="divFeaturesBox"
      className="mt-4 rounded-lg border border-green-200 bg-green-50/80 p-3"
    >
      <h3 id="h3FeaturesTitle" className="mb-2 text-sm font-semibold text-slate-800">
        Features
      </h3>
      <ul id="ulFeaturesList" className="list-inside list-disc space-y-1 text-sm text-slate-700">
        {labels.map((label, i) => (
          <li key={`${i}-${label.slice(0, 20)}`} id={`liFeature-${i}`}>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
