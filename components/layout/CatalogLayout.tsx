"use client";

/**
 * Layout: left category strip (vertical buttons) | item part (3 sections) | viewer + strip | details.
 */

import React from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { ALLOWED_CATEGORIES } from "@/types/product";
import CategoryList from "@/components/sidebar/CategoryList";
import ProductList from "@/components/sidebar/ProductList";
import ProductViewer from "@/components/viewer/ProductViewer";
import ProductDetails from "@/components/details/ProductDetails";
import ProductStrip from "@/components/strip/ProductStrip";

interface CatalogLayoutProps {
  products: Product[];
  lastUpdated: string | null;
}

const ACTIVATED_KEY = "catalog_activated";

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

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    const ordered = ALLOWED_CATEGORIES.filter((c) => set.has(c));
    const rest = Array.from(set).filter((c) => !ALLOWED_CATEGORIES.includes(c));
    return [...ordered, ...rest];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return products;
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
      <header className="flex shrink-0 items-center justify-between border-b border-green-200 bg-green-200 px-5 py-3 shadow-sm">
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

      <div className="flex flex-1 min-h-0">
        {/* Left: category buttons only, stacked vertically */}
        <aside
          id="divCategoryStrip"
          className="flex w-14 shrink-0 flex-col border-r border-green-200 bg-green-50/80"
        >
          <div id="divSidebarCategories" className="flex flex-col gap-0.5 p-1">
            <CategoryList
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </aside>

        {/* Item part: section 1 = 60% (main list), section 2 & 3 = 20% each (to be defined later) */}
        <div
          id="divItemPart"
          className="flex min-h-0 w-72 shrink-0 flex-col border-r border-green-200 bg-white p-2"
        >
          <div
            id="divItemPartSection1"
            className="scrollbar-hide min-h-0 flex-[0_0_60%] overflow-auto rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label="Item list"
          >
            <ProductList
              products={filteredProducts}
              selected={selectedProduct}
              onSelect={setSelectedProduct}
            />
          </div>
          <div
            id="divItemPartSection2"
            className="mt-2 min-h-0 flex-[0_0_20%] shrink-0 rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label="Item part section 2"
          >
            {/* Content to be defined later */}
          </div>
          <div
            id="divItemPartSection3"
            className="mt-2 min-h-0 flex-[0_0_20%] shrink-0 rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label="Item part section 3"
          >
            {/* Content to be defined later */}
          </div>
        </div>

        <main className="flex flex-1 min-w-0 flex-col">
          <div
            id="divMainViewer"
            className="flex flex-1 min-h-0 border-b border-green-200 bg-green-50 p-4"
          >
            <ProductViewer product={selectedProduct} />
          </div>
          <div
            id="divProductStrip"
            className="scrollbar-hide h-24 shrink-0 overflow-x-auto border-t border-green-200 bg-green-50 p-2"
          >
            <ProductStrip
              products={products}
              selected={selectedProduct}
              onSelect={setSelectedProduct}
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
    </div>
  );
}
