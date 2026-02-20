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
    <ul id="divProductListScroll" className="flex flex-col gap-0.5">
      {products.map((p) => (
        <li key={p.itmGroupName}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            className={`w-full rounded px-3 py-1.5 text-left text-sm ${
              selected?.itmGroupName === p.itmGroupName
                ? "bg-blue-100 font-medium text-blue-800"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {p.itmGroupName}
          </button>
        </li>
      ))}
    </ul>
  );
}
