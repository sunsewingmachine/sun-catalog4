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
import ImageLightbox from "@/components/viewer/ImageLightbox";
import ProductDetails from "@/components/details/ProductDetails";
import AdditionalImagesStrip from "@/components/strip/AdditionalImagesStrip";
import CommonImagesBar from "@/components/strip/CommonImagesBar";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";

interface CatalogLayoutProps {
  products: Product[];
  lastUpdated: string | null;
  /** Version from Google Sheets db tab (cell B1). */
  dbVersion: string;
  /** App version shown in UI (e.g. 1.0). */
  appVersion: string;
}

const ACTIVATED_KEY = "catalog_activated";
const RECENTLY_VIEWED_KEY = "catalog_recently_viewed";
const RECENTLY_VIEWED_MAX = 5;
/** Sentinel category: when selected, section 1 shows products ordered by AF column. */
const BEST_CATEGORY = "Best";
/** Interval (ms) between Best button attention animation (blink + stars). */
const BEST_ATTENTION_INTERVAL_MS = 20000;
/** Number of stars that rise from the Best button each cycle. */
const BEST_STAR_COUNT = 14;
/** Sparkle particles burst outward (angle in deg, radius ~44px). */
const BEST_SPARKLE_BURST = [
  { x: 0, y: -44 },
  { x: 22, y: -38 },
  { x: 38, y: -22 },
  { x: 44, y: 0 },
  { x: 38, y: 22 },
  { x: 22, y: 38 },
  { x: 0, y: 44 },
  { x: -22, y: 38 },
  { x: -38, y: 22 },
  { x: -44, y: 0 },
  { x: -38, y: -22 },
  { x: -22, y: -38 },
];

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
  dbVersion,
  appVersion,
}: CatalogLayoutProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  /** True when current selection was made by clicking in section 2 (recently viewed). Used to avoid highlighting in section 2 when user clicked in section 1. */
  const [selectionFromRecentList, setSelectionFromRecentList] = React.useState(false);
  const [recentlyViewed, setRecentlyViewed] = React.useState<Product[]>([]);
  const [bestBurstKey, setBestBurstKey] = React.useState(0);
  const hasHydratedFromStorage = React.useRef(false);
  /** When set, main viewer shows this image URL (e.g. after single-click in common images bar). */
  const [mainImageOverride, setMainImageOverride] = React.useState<string | null>(null);
  /** When set, full-size zoomable lightbox is open with this image. */
  const [lightboxImage, setLightboxImage] = React.useState<{ src: string; alt: string } | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => setBestBurstKey((k) => k + 1), BEST_ATTENTION_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (products.length === 0 || hasHydratedFromStorage.current) return;
    hasHydratedFromStorage.current = true;
    const fromStorage = loadRecentlyViewedFromStorage(products);
    if (fromStorage.length > 0) setRecentlyViewed(fromStorage);
  }, [products]);

  const handleSelectProductFromMain = React.useCallback((p: Product) => {
    setSelectionFromRecentList(false);
    setMainImageOverride(null);
    setSelectedProduct(p);
    setRecentlyViewed((prev) => {
      const without = prev.filter((x) => x.itmGroupName !== p.itmGroupName);
      const next = [...without, p].slice(-RECENTLY_VIEWED_MAX);
      saveRecentlyViewedToStorage(next);
      return next;
    });
  }, []);

  const handleSelectProductFromRecent = React.useCallback((p: Product) => {
    setSelectionFromRecentList(true);
    setMainImageOverride(null);
    setSelectedProduct(p);
    // Do not reorder recently viewed when clicking an item already in the list.
  }, []);

  const openLightbox = React.useCallback((imageSrc: string, imageAlt: string) => {
    setLightboxImage({ src: imageSrc, alt: imageAlt });
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

  // Sync main-list selection only when selection did not come from recent list (e.g. category change).
  // When user clicked recent list, do not overwrite selection or highlight main list.
  React.useEffect(() => {
    if (selectionFromRecentList || filteredProducts.length === 0) return;
    const currentInList = selectedProduct && filteredProducts.some((p) => p.itmGroupName === selectedProduct.itmGroupName);
    if (!currentInList) {
      setSelectedProduct(filteredProducts[0] ?? null);
      setMainImageOverride(null);
      setSelectionFromRecentList(false);
    }
  }, [filteredProducts, selectedProduct?.itmGroupName, selectionFromRecentList]);

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
          {/* Best button first (top), same position as former first category */}
          <div id="divSidebarBest" className="relative shrink-0 overflow-visible p-1 pt-4">
            <div className="relative">
              {/* Blast flash at burst trigger */}
              <span
                key={`blast-${bestBurstKey}`}
                className="best-blast-flash absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-amber-300/90"
                style={{ transform: "translate(-50%, -50%)" }}
                aria-hidden
              />
              {/* Sparkle particles bursting outward */}
              {BEST_SPARKLE_BURST.map(({ x, y }, i) => (
                <span
                  key={`sparkle-${bestBurstKey}-${i}`}
                  className="best-sparkle absolute left-1/2 bottom-1 inline-block h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_6px_2px_rgba(255,215,0,0.9)]"
                  style={{
                    left: "50%",
                    bottom: "4px",
                    ["--sparkle-x" as string]: `${x}px`,
                    ["--sparkle-y" as string]: `${y}px`,
                    animationDelay: `${i * 0.03}s`,
                  }}
                  aria-hidden
                />
              ))}
              {Array.from({ length: BEST_STAR_COUNT }, (_, i) => (
                <span
                  key={`${bestBurstKey}-${i}`}
                  className="best-star absolute inline-block drop-shadow-md"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    left: "50%",
                    bottom: "2px",
                  }}
                  aria-hidden
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" className="block">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill="#b8860b"
                      stroke="#dc2626"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ))}
              <button
                type="button"
                id="btnCategoryBest"
                onClick={() => setSelectedCategory(BEST_CATEGORY)}
                title="Best (AF order)"
                className={`animate-best-blink w-full rounded px-1.5 py-1 text-center text-sm font-medium transition-colors truncate text-black ${
                  selectedCategory === BEST_CATEGORY
                    ? "bg-red-600 shadow-sm"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Best
              </button>
            </div>
          </div>
          <div id="divSidebarCategories" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-1">
            <CategoryList
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <div
            id="divSidebarVersion"
            className="shrink-0 border-t border-green-200 px-1 py-1.5 text-[10px] leading-tight text-slate-500"
            aria-label="Database and app version"
          >
            <div>VerDb:{dbVersion || "—"}</div>
            <div>VerApp:{appVersion}</div>
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
              selected={selectionFromRecentList ? null : selectedProduct}
              onSelect={handleSelectProductFromMain}
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
              highlightSelected={selectionFromRecentList}
              onSelect={handleSelectProductFromRecent}
            />
          </div>
        </div>

        <main className="flex flex-1 min-w-0 flex-col min-h-0">
          <div
            id="divMainViewer"
            className="flex shrink-0 flex-col border-b border-green-200 bg-green-50 p-4"
          >
            <div className="flex shrink-0 flex-col" aria-hidden>
              <ProductViewer
                product={selectedProduct}
                mainImageOverride={mainImageOverride}
                onOpenLightbox={openLightbox}
              />
            </div>
          </div>
          <AdditionalImagesStrip
            product={selectedProduct}
            onSetMainImage={setMainImageOverride}
            onOpenLightbox={openLightbox}
          />
          <TestimonialsSection />
        </main>

        <aside
          id="divDetailsPanel"
          className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-green-200 bg-green-50"
        >
          <ProductDetails product={selectedProduct} lastUpdated={lastUpdated} />
        </aside>
      </div>

      <CommonImagesBar
        products={products}
        onSetMainImage={setMainImageOverride}
        onOpenLightbox={openLightbox}
      />
      {lightboxImage && (
        <ImageLightbox
          imageSrc={lightboxImage.src}
          imageAlt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
