"use client";

/**
 * Three-column desktop layout: sidebar (categories + product list) | viewer | details. Bottom product strip.
 */

import React from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
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
    return Array.from(set).sort();
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
      className="flex h-screen flex-col bg-zinc-100 text-zinc-800"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2">
        <h1 className="text-lg font-semibold">Sewing Machines Catalog</h1>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.sessionStorage.removeItem(ACTIVATED_KEY);
            router.push("/");
          }}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Deactivate
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          id="divSidebar"
          className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white"
        >
          <div id="divSidebarCategories" className="shrink-0 p-2">
            <CategoryList
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <div
            id="divProductList"
            className="flex-1 overflow-auto p-2"
          >
            <ProductList
              products={filteredProducts}
              selected={selectedProduct}
              onSelect={setSelectedProduct}
            />
          </div>
        </aside>

        <main className="flex flex-1 min-w-0 flex-col">
          <div
            id="divMainViewer"
            className="flex flex-1 min-h-0 border-b border-zinc-200 bg-white p-4"
          >
            <ProductViewer product={selectedProduct} />
          </div>
          <div
            id="divProductStrip"
            className="h-24 shrink-0 overflow-x-auto border-t border-zinc-200 bg-white p-2"
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
          className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-zinc-200 bg-white"
        >
          <ProductDetails product={selectedProduct} lastUpdated={lastUpdated} />
        </aside>
      </div>
    </div>
  );
}
