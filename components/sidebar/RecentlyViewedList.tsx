"use client";

/**
 * Compact list of recently clicked products (max 5). Last viewed first. Used in item part section 2.
 */

import type { Product } from "@/types/product";

interface RecentlyViewedListProps {
  products: Product[];
  selected: Product | null;
  /** When false, no item is highlighted (e.g. when selection came from section 1). */
  highlightSelected?: boolean;
  onSelect: (product: Product) => void;
}

export default function RecentlyViewedList({
  products,
  selected,
  highlightSelected = true,
  onSelect,
}: RecentlyViewedListProps) {
  if (products.length === 0) {
    return (
      <p id="pRecentlyViewedEmpty" className="text-xs text-slate-500">
        No recently viewed
      </p>
    );
  }
  return (
    <ul id="ulRecentlyViewedList" className="flex flex-col gap-1">
      {products.map((p) => {
        const isHighlighted = highlightSelected && selected?.itmGroupName === p.itmGroupName;
        return (
        <li key={p.itmGroupName}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            title={p.itmGroupName}
            className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm font-medium transition-colors ${
              isHighlighted
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-green-100 text-slate-700 hover:bg-green-200"
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{p.itmGroupName}</span>
            {p.af != null && p.af > 0 && (
              <img
                src="/used/tick.png"
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] shrink-0"
                aria-hidden
              />
            )}
          </button>
        </li>
      );
      })}
    </ul>
  );
}
