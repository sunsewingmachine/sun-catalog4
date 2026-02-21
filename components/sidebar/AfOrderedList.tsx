"use client";

/**
 * Fixed list of products ordered by column AF (1, 2, 3, …).
 * getProductsOrderedByAf is used by CatalogLayout when "Best" category is selected; component used elsewhere if needed.
 */

import type { Product } from "@/types/product";

interface AfOrderedListProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
}

export function getProductsOrderedByAf(products: Product[]): Product[] {
  const withAf = products.filter((p): p is Product & { af: number } => p.af != null && p.af > 0);
  return [...withAf].sort((a, b) => a.af - b.af);
}

export default function AfOrderedList({
  products,
  selected,
  onSelect,
}: AfOrderedListProps) {
  const ordered = getProductsOrderedByAf(products);
  if (ordered.length === 0) {
    return (
      <p id="pAfOrderedEmpty" className="text-xs text-slate-500">
        No items with order number
      </p>
    );
  }
  return (
    <ul id="ulAfOrderedList" className="flex flex-col gap-1">
      {ordered.map((p, index) => (
        <li key={`${p.itmGroupName}-${index}`}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            title={p.itmGroupName}
            className={`w-full rounded px-1.5 py-1 text-left text-sm font-medium transition-colors truncate ${
              selected?.itmGroupName === p.itmGroupName
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-green-100 text-slate-700 hover:bg-green-200"
            }`}
          >
            {p.itmGroupName}
          </button>
        </li>
      ))}
    </ul>
  );
}
