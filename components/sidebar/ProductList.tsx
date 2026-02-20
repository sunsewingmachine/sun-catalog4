"use client";

/**
 * Scrollable list of products for selected category. Virtualized for large lists later.
 */

import type { Product } from "@/types/product";

interface ProductListProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
}

export default function ProductList({
  products,
  selected,
  onSelect,
}: ProductListProps) {
  return (
    <ul id="divProductListScroll" className="flex flex-col gap-1">
      {products.map((p, index) => (
        <li
          key={p.itmGroupName}
          className="catalog-item-in opacity-0"
          style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
        >
          <button
            type="button"
            onClick={() => onSelect(p)}
            title={p.itmGroupName}
            className={`w-full rounded px-1.5 py-1 text-left text-xs font-medium transition-colors truncate ${
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
