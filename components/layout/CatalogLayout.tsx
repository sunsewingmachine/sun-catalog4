"use client";

/**
 * Layout: left category strip (vertical buttons) | item part (section 1 + section 2) | viewer + strip | details.
 * "Best" category shows items ordered by AF column in section 1.
 */

import React from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { ALLOWED_CATEGORIES } from "@/types/product";
import CategoryList from "@/components/sidebar/CategoryList";
import ProductList from "@/components/sidebar/ProductList";
import RecentlyViewedList from "@/components/sidebar/RecentlyViewedList";
import { getProductsOrderedByAf } from "@/components/sidebar/AfOrderedList";
import ProductViewer from "@/components/viewer/ProductViewer";
import ProductDetails from "@/components/details/ProductDetails";
import ProductStrip from "@/components/strip/ProductStrip";
import CommonImagesBar from "@/components/strip/CommonImagesBar";

interface CatalogLayoutProps {
  products: Product[];
  lastUpdated: string | null;
}

const ACTIVATED_KEY = "catalog_activated";
const RECENTLY_VIEWED_KEY = "catalog_recently_viewed";
const RECENTLY_VIEWED_MAX = 5;
/** Sentinel category: when selected, section 1 shows products ordered by AF column. */
const BEST_CATEGORY = "Best";

function loadRecentlyViewedFromStorage(products: Product[]): Product[] {
  if (typeof window === "undefined" || products.length === 0) return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const ids: unknown = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];
    const byName = new Map(products.map((p) => [p.itmGroupName, p]));
    return (ids as string[])
      .slice(0, RECENTLY_VIEWED_MAX)
      .map((id) => byName.get(id))
      .filter((p): p is Product => p != null);
  } catch {
    return [];
  }
}

function saveRecentlyViewedToStorage(items: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    const ids = items.slice(0, RECENTLY_VIEWED_MAX).map((p) => p.itmGroupName);
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export default function CatalogLayout({
  products,
  lastUpdated,
}: CatalogLayoutProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [recentlyViewed, setRecentlyViewed] = React.useState<Product[]>([]);
  const hasHydratedFromStorage = React.useRef(false);

  React.useEffect(() => {
    if (products.length === 0 || hasHydratedFromStorage.current) return;
    hasHydratedFromStorage.current = true;
    const fromStorage = loadRecentlyViewedFromStorage(products);
    if (fromStorage.length > 0) setRecentlyViewed(fromStorage);
  }, [products]);

  const handleSelectProduct = React.useCallback((p: Product) => {
    setSelectedProduct(p);
    setRecentlyViewed((prev) => {
      const without = prev.filter((x) => x.itmGroupName !== p.itmGroupName);
      const next = [...without, p].slice(-RECENTLY_VIEWED_MAX);
      saveRecentlyViewedToStorage(next);
      return next;
    });
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    const ordered = ALLOWED_CATEGORIES.filter((c) => set.has(c));
    const rest = Array.from(set).filter((c) => !ALLOWED_CATEGORIES.includes(c));
    return [...ordered, ...rest];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return products;
    if (selectedCategory === BEST_CATEGORY) return getProductsOrderedByAf(products);
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  React.useEffect(() => {
    if (categories.length && !selectedCategory) setSelectedCategory(categories[0] ?? null);
  }, [categories, selectedCategory]);

  React.useEffect(() => {
    if (filteredProducts.length === 0) return;
    const currentInList = selectedProduct && filteredProducts.some((p) => p.itmGroupName === selectedProduct.itmGroupName);
    if (!currentInList) setSelectedProduct(filteredProducts[0] ?? null);
  }, [filteredProducts, selectedProduct?.itmGroupName]);

  return (
    <div
      id="divCatalogRoot"
      className="flex h-screen flex-col bg-green-50 text-slate-800"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-200 bg-green-200 px-5 py-3 shadow-sm">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex shrink-0 text-slate-700" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          Catalog
        </h1>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.sessionStorage.removeItem(ACTIVATED_KEY);
            router.push("/");
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-green-100 hover:text-slate-700"
        >
          Deactivate
        </button>
      </header>

      <div className="mb-4 flex flex-1 min-h-0">
        {/* Left: category buttons only, stacked vertically */}
        <aside
          id="divCategoryStrip"
          className="flex w-14 shrink-0 flex-col border-r border-green-200 bg-green-50/80"
        >
          <div id="divSidebarCategories" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-1 pt-4">
            <CategoryList
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <div id="divSidebarBest" className="shrink-0 p-1 pb-4">
            <button
              type="button"
              id="btnCategoryBest"
              onClick={() => setSelectedCategory(BEST_CATEGORY)}
              title="Best (AF order)"
              className={`w-full rounded px-1.5 py-1 text-center text-sm font-medium transition-colors truncate ${
                selectedCategory === BEST_CATEGORY
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-green-100 text-slate-700 hover:bg-green-200"
              }`}
            >
              Best
            </button>
          </div>
        </aside>

        {/* Item part: section 1 = main list (full height), section 2 = 5-row recently viewed */}
        <div
          id="divItemPart"
          className="flex min-h-0 w-72 shrink-0 flex-col border-r border-green-200 bg-white p-2"
        >
          <div
            id="divItemPartSection1"
            className="scrollbar-hide min-h-0 flex-1 overflow-auto rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label={selectedCategory === BEST_CATEGORY ? "Items ordered by AF column" : "Item list"}
          >
            <ProductList
              key={selectedCategory ?? ""}
              products={filteredProducts}
              selected={selectedProduct}
              onSelect={handleSelectProduct}
            />
          </div>
          <div
            id="divItemPartSection2"
            className="mt-2 h-[11rem] shrink-0 rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label="Recently viewed items"
          >
            <RecentlyViewedList
              products={recentlyViewed}
              selected={selectedProduct}
              onSelect={handleSelectProduct}
            />
          </div>
        </div>

        <main className="flex flex-1 min-w-0 flex-col">
          <div
            id="divMainViewer"
            className="flex min-h-0 flex-1 flex-col border-b border-green-200 bg-green-50 p-4"
          >
            <div className="flex min-h-0 flex-1 flex-col" aria-hidden>
              <ProductViewer product={selectedProduct} />
            </div>
          </div>
          <div
            id="divProductStrip"
            className="scrollbar-hide h-24 shrink-0 overflow-x-auto border-t border-green-200 bg-green-50 p-2"
          >
            <ProductStrip
              products={products}
              selected={selectedProduct}
              onSelect={handleSelectProduct}
            />
          </div>
        </main>

        <aside
          id="divDetailsPanel"
          className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-green-200 bg-green-50"
        >
          <ProductDetails product={selectedProduct} lastUpdated={lastUpdated} />
        </aside>
      </div>

      <CommonImagesBar products={products} />
    </div>
  );
}
