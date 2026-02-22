"use client";

/**
 * Fixed list of products ordered by column AF (1, 2, 3, …).
 * getBestProducts is used by CatalogLayout when "Best" is selected (only items with TargetSellingOrder). getProductsOrderedByAf used by this component for full ordered list.
 */

import type { Product } from "@/types/product";

interface AfOrderedListProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
}

/**
 * Returns only products that have a value in the TargetSellingOrder column (AF), sorted by that value.
 * Used when "Best" is selected so the list shows only items with an order number.
 */
export function getBestProducts(products: Product[]): Product[] {
  const withAf = products.filter((p): p is Product & { af: number } => p.af != null && p.af > 0);
  return [...withAf].sort((a, b) => a.af - b.af);
}

/**
 * Returns all products with "Best" ordering: those with column AF first (sorted by AF), then products without AF.
 * Used by AfOrderedList component when a full ordered list is needed (e.g. section 2).
 */
export function getProductsOrderedByAf(products: Product[]): Product[] {
  const withAf = products.filter((p): p is Product & { af: number } => p.af != null && p.af > 0);
  const withoutAf = products.filter((p) => p.af == null || p.af <= 0);
  const orderedWithAf = [...withAf].sort((a, b) => a.af - b.af);
  return [...orderedWithAf, ...withoutAf];
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
