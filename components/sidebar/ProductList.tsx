"use client";

/**
 * Scrollable list of products for selected category.
 * In share mode each row shows a checkbox alongside the item; clicking the row still views the product.
 */

import type { Product } from "@/types/product";
import type { ShareMode } from "@/lib/shareHelpers";
import HighWarrantyTick from "@/components/sidebar/HighWarrantyTick";

const SHARE_MAX_ITEMS = 10;

interface ProductListProps {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
  /** When set, checkboxes are shown next to each item. */
  shareMode?: ShareMode | null;
  /** Set of itmGroupNames currently ticked for sharing. */
  shareSelectedItems?: Set<string>;
  /** Called when user ticks/unticks a checkbox. */
  onToggleShareItem?: (itmGroupName: string) => void;
}

export default function ProductList({
  products,
  selected,
  onSelect,
  shareMode = null,
  shareSelectedItems,
  onToggleShareItem,
}: ProductListProps) {
  const isShareActive = shareMode != null;

  return (
    <ul id="divProductListScroll" className="flex flex-col gap-1">
      {products.map((p, index) => {
        const isSelected = selected?.itmGroupName === p.itmGroupName;
        const isShareChecked = isShareActive && (shareSelectedItems?.has(p.itmGroupName) ?? false);
        const isShareDisabled = isShareActive && !isShareChecked && (shareSelectedItems?.size ?? 0) >= SHARE_MAX_ITEMS;

        return (
          <li
            key={`${p.itmGroupName}-${index}`}
            className={`catalog-item-in opacity-0 ${p.af != null && p.af > 0 ? "high-warranty-row" : ""}`}
            style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
          >
            <div className="flex w-full items-center gap-1">
              {isShareActive && (
                <input
                  id={`chkShare_${p.itmGroupName.replace(/[.:]/g, "_")}`}
                  type="checkbox"
                  checked={isShareChecked}
                  disabled={isShareDisabled}
                  onChange={() => onToggleShareItem?.(p.itmGroupName)}
                  className={`h-4 w-4 shrink-0 rounded border-green-400 accent-green-600 ${isShareDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
                  aria-label={`Select ${p.itmGroupName} for sharing`}
                  title={isShareDisabled ? `Max ${SHARE_MAX_ITEMS} items allowed` : p.itmGroupName}
                />
              )}
              <button
                type="button"
                id={`listItem_${p.itmGroupName.replace(/[.:]/g, "_")}`}
                onClick={() => onSelect(p)}
                title={p.itmGroupName}
                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-green-100 text-slate-700 hover:bg-green-200"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{p.itmGroupName}</span>
                {p.af != null && p.af > 0 && <HighWarrantyTick />}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
