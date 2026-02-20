/**
 * Extracts category from Col A (ItmGroupName): first segment before first dot, lowercased.
 * Filters to allowed categories only (sv, ta1, ol, 31k, zig, fm, pow, tab, stn, motor, gen).
 */

import { ALLOWED_CATEGORIES, type AllowedCategory } from "@/types/product";

const ALLOWED_SET = new Set<string>(ALLOWED_CATEGORIES);

export function getCategoryFromItmGroupName(itmGroupName: string): string {
  const trimmed = (itmGroupName ?? "").trim();
  const firstSegment = trimmed.split(".")[0] ?? "";
  return firstSegment.toLowerCase();
}

export function isAllowedCategory(category: string): category is AllowedCategory {
  return ALLOWED_SET.has(category.toLowerCase());
}

export function getUniqueAllowedCategoriesFromProducts(
  products: { category: string }[]
): AllowedCategory[] {
  const seen = new Set<string>();
  const result: AllowedCategory[] = [];
  for (const p of products) {
    const cat = p.category.toLowerCase();
    if (ALLOWED_SET.has(cat) && !seen.has(cat)) {
      seen.add(cat);
      result.push(cat as AllowedCategory);
    }
  }
  return result;
}
