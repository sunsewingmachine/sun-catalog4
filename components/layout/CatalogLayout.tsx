"use client";

/**
 * Layout: left category strip (vertical buttons) | item part (section 1 + section 2) | viewer + strip | details.
 * "Best" category shows only items with a value in TargetSellingOrder (AF) column, ordered by that value.
 */

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Product } from "@/types/product";
import { getWholesaleStringThreeLines } from "@/lib/wholesalePriceHelper";
import type { UltraRow } from "@/lib/ultraPriceHelper";
import type { FeatureRecord } from "@/types/feature";
import { ALLOWED_CATEGORIES } from "@/types/product";
import CategoryList from "@/components/sidebar/CategoryList";
import ProductList from "@/components/sidebar/ProductList";
import RecentlyViewedList from "@/components/sidebar/RecentlyViewedList";
import { getBestProducts } from "@/components/sidebar/AfOrderedList";
import ProductViewer from "@/components/viewer/ProductViewer";

const ImageLightbox = dynamic(
  () => import("@/components/viewer/ImageLightbox").then((m) => m.default),
  { ssr: false }
);

import ProductDetails from "@/components/details/ProductDetails";
import { isVideoMediaUrl } from "@/components/details/FeaturesBox";
import { getImageUrl } from "@/lib/r2ImageHelper";
import AdditionalImagesStrip from "@/components/strip/AdditionalImagesStrip";
import ServerImagesStrip from "@/components/strip/ServerImagesStrip";
import CommonImagesBar from "@/components/strip/CommonImagesBar";
import type { ImageSyncProgress } from "@/lib/imageSyncService";

interface CatalogLayoutProps {
  products: Product[];
  /** Features table (col A = key, col B = label) from Features sheet for EY lookup. */
  features: FeatureRecord[];
  /** Raw ItmGroup rows from cache only (no fetch); used for exchange price table. */
  rawItmGroupRows?: string[][];
  lastUpdated: string | null;
  /** Version from Google Sheets db tab (cell B1). */
  dbVersion: string;
  /** App version shown in UI (e.g. 1.0). */
  appVersion: string;
  /** When provided, settings menu shows Refresh; on confirm, this fetches catalog and images from server. */
  onRequestRefresh?: () => Promise<void>;
  /** When set, shows a small non-blocking "Syncing images" bar (background sync). */
  imageSyncProgress?: ImageSyncProgress | null;
  /** When provided, settings menu shows Logout submenu (Logout, Clear cache, Clear cache and logout). */
  onLogout?: () => void;
  onClearCache?: () => Promise<void>;
  onClearCacheAndLogout?: () => Promise<void>;
}

/** Exchange price submenu keys and separators for "Exchange price" in settings. Row 2 header in sheet uses e.g. C1:Sv:FinalExchangePrice. */
const EXCHANGE_PRICE_SUBMENUS: (string | "---")[] = [
  "C1:Sv",
  "C2:Sv",
  "C3:Sv",
  "C4:Sv",
  "---",
  "C1:Ta1",
  "C2:Ta1",
  "C3:Ta1",
  "C4:Ta1",
  "---",
  "C1:Motor",
  "C2:Motor",
  "C3:Motor",
  "C4:Motor",
];

const RECENTLY_VIEWED_KEY = "catalog_recently_viewed";
/** LocalStorage key for Wholesale price toggle (Info submenu). */
const SHOW_WS_KEY = "catalog_show_ws";
/** LocalStorage keys for Info menu: hide entire product info box (when off), hide price field, hide warranty field. */
const HIDE_ALL_KEY = "catalog_hide_all";
const HIDE_PRICE_KEY = "catalog_hide_price";
const HIDE_WARRANTY_KEY = "catalog_hide_warranty";
const RECENTLY_VIEWED_MAX = 5;
/** Sentinel category: when selected, section 1 shows only products with TargetSellingOrder (AF) value, ordered by it. */
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
  features,
  rawItmGroupRows,
  lastUpdated,
  dbVersion,
  appVersion,
  onRequestRefresh,
  imageSyncProgress,
  onLogout,
  onClearCache,
  onClearCacheAndLogout,
}: CatalogLayoutProps) {
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
  /** When set, main viewer shows this image URL (e.g. after single-click in common images bar or feature). */
  const [mainImageOverride, setMainImageOverride] = React.useState<string | null>(null);
  /** When set, main area shows this image on hover over strip thumbs; cleared when mouse leaves the 3 rows. */
  const [mainImageHoverPreview, setMainImageHoverPreview] = React.useState<string | null>(null);
  /** When set, main viewer shows this video URL (e.g. after clicking a feature with video in col C). */
  const [mainVideoOverride, setMainVideoOverride] = React.useState<string | null>(null);
  /** When set, full-size zoomable lightbox is open with this image. */
  const [lightboxImage, setLightboxImage] = React.useState<{ src: string; alt: string } | null>(null);
  /** True when the page is in browser fullscreen (hides Chrome bar, taskbar). Synced via fullscreenchange. */
  const [isBrowserFullscreen, setIsBrowserFullscreen] = React.useState(false);
  /** Fullscreen API available (secure context, no blocking iframes). Set once on mount. */
  const [fullscreenSupported, setFullscreenSupported] = React.useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const settingsMenuRef = React.useRef<HTMLDivElement>(null);
  /** Ref for the combined settings + Bybk fly-out area; used to close fly-out only when pointer leaves entire menu. */
  const settingsDropdownWrapperRef = React.useRef<HTMLDivElement>(null);
  /** When set, details panel shows exchange price table for this key (e.g. C1:Sv); best image moves to main image overlay. */
  const [selectedExchangeMenu, setSelectedExchangeMenu] = React.useState<string | null>(null);
  /** When true, Exchange price submenus are visible; toggled by hover/click on Exchange price header. */
  const [bybkSubmenuExpanded, setBybkSubmenuExpanded] = React.useState(false);
  /** When true, Info submenu (All, Price, Warranty, W/s price) is visible. */
  const [infoSubmenuExpanded, setInfoSubmenuExpanded] = React.useState(false);
  /** When true, Logout submenu (Logout, Clear cache, Clear cache and logout) is visible. */
  const [logoutSubmenuExpanded, setLogoutSubmenuExpanded] = React.useState(false);
  /** When true, details panel shows Ultra price box with column A from sheet NEXT_PUBLIC_ULTRA_GID. */
  const [ultraPriceBoxOpen, setUltraPriceBoxOpen] = React.useState(false);
  /** When user clicks an Ultra/Aristo/Base item in the Ultra box, show mainItem.Variant.jpg in main area; persists across main list changes while box is open. */
  const [ultraSelectedVariant, setUltraSelectedVariant] = React.useState<"Ultra" | "Aristo" | "Base" | null>(null);
  /** Keys "itmGroupName.Variant" for which the variant image failed (404); avoid reusing that URL. */
  const [variantImageFailed, setVariantImageFailed] = React.useState<Set<string>>(() => new Set());
  /** Ultra sheet rows (cols A,B,C,D); populated when ultraPriceBoxOpen is true and sheet is fetched. */
  const [ultraRows, setUltraRows] = React.useState<UltraRow[]>([]);
  const [ultraPriceLoading, setUltraPriceLoading] = React.useState(false);
  const [ultraPriceError, setUltraPriceError] = React.useState<string | null>(null);
  /** Filenames for 3-row area below main image: ForAll and ForGroup (from /api/bar-images). */
  const [barImages, setBarImages] = React.useState<{
    forAll: string[];
    forGroup: string[];
    hint?: "r2_not_configured";
  }>({ forAll: [], forGroup: [] });
  /** Show wholesale prices above bottom bar; persisted in localStorage. */
  const [showWs, setShowWs] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = window.localStorage.getItem(SHOW_WS_KEY);
      return v === "1" || v === "true";
    } catch {
      return false;
    }
  });
  const hasHydratedShowWs = React.useRef(false);
  React.useEffect(() => {
    if (hasHydratedShowWs.current) return;
    hasHydratedShowWs.current = true;
    try {
      const v = window.localStorage.getItem(SHOW_WS_KEY);
      setShowWs(v === "1" || v === "true");
    } catch {
      // ignore
    }
  }, []);
  const setShowWsAndPersist = React.useCallback((value: boolean) => {
    setShowWs(value);
    try {
      window.localStorage.setItem(SHOW_WS_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  /** Hide product info box entirely; persisted in localStorage. */
  const [hideAll, setHideAll] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = window.localStorage.getItem(HIDE_ALL_KEY);
      return v === "1" || v === "true";
    } catch {
      return false;
    }
  });
  /** Hide only price field in product info; persisted in localStorage. */
  const [hidePrice, setHidePrice] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = window.localStorage.getItem(HIDE_PRICE_KEY);
      return v === "1" || v === "true";
    } catch {
      return false;
    }
  });
  /** Hide only warranty field in product info; persisted in localStorage. */
  const [hideWarranty, setHideWarranty] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = window.localStorage.getItem(HIDE_WARRANTY_KEY);
      return v === "1" || v === "true";
    } catch {
      return false;
    }
  });
  const hasHydratedHide = React.useRef(false);
  React.useEffect(() => {
    if (hasHydratedHide.current) return;
    hasHydratedHide.current = true;
    try {
      setHideAll(window.localStorage.getItem(HIDE_ALL_KEY) === "1" || window.localStorage.getItem(HIDE_ALL_KEY) === "true");
      setHidePrice(window.localStorage.getItem(HIDE_PRICE_KEY) === "1" || window.localStorage.getItem(HIDE_PRICE_KEY) === "true");
      setHideWarranty(window.localStorage.getItem(HIDE_WARRANTY_KEY) === "1" || window.localStorage.getItem(HIDE_WARRANTY_KEY) === "true");
    } catch {
      // ignore
    }
  }, []);
  const setHideAllAndPersist = React.useCallback((value: boolean) => {
    setHideAll(value);
    try {
      window.localStorage.setItem(HIDE_ALL_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);
  const setHidePriceAndPersist = React.useCallback((value: boolean) => {
    setHidePrice(value);
    try {
      window.localStorage.setItem(HIDE_PRICE_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);
  const setHideWarrantyAndPersist = React.useCallback((value: boolean) => {
    setHideWarranty(value);
    try {
      window.localStorage.setItem(HIDE_WARRANTY_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  /** Defer bar-images (GEN + CAT list) fetch so app shell opens faster. GEN loads once on app load; 5s delay as GEN is not critical initially. */
  const DELAY_MS_BAR_FETCH = 5000;
  React.useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetch("/api/bar-images")
        .then((res) => res.json())
        .then((data: { forAll?: string[]; forGroup?: string[]; _hint?: "r2_not_configured" }) => {
          if (cancelled) return;
          setBarImages({
            forAll: Array.isArray(data.forAll) ? data.forAll : [],
            forGroup: Array.isArray(data.forGroup) ? data.forGroup : [],
            hint: data._hint,
          });
        })
        .catch(() => {
          if (!cancelled) setBarImages({ forAll: [], forGroup: [] });
        });
    }, DELAY_MS_BAR_FETCH);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  React.useEffect(() => {
    if (!ultraPriceBoxOpen) {
      setUltraRows([]);
      setUltraPriceError(null);
      setUltraSelectedVariant(null);
      return;
    }
    let cancelled = false;
    setUltraPriceLoading(true);
    setUltraPriceError(null);
    fetch("/api/ultra-price")
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error((d as { error?: string }).error ?? "Failed to load")));
        return res.json();
      })
      .then((data: { rows?: UltraRow[] }) => {
        if (cancelled) return;
        setUltraRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setUltraPriceError(e instanceof Error ? e.message : "Ultra price data is not available.");
          setUltraRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setUltraPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ultraPriceBoxOpen]);

  /** Detect fullscreen API support on mount (client-only). */
  React.useEffect(() => {
    const doc = document as Document & { fullscreenEnabled?: boolean; webkitFullscreenEnabled?: boolean };
    const enabled = doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false;
    const root = document.documentElement;
    const hasRequest =
      typeof root.requestFullscreen === "function" ||
      typeof (root as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen === "function";
    setFullscreenSupported(Boolean(enabled && hasRequest));
  }, []);

  /** Sync isBrowserFullscreen when user enters/exits via API or Esc. */
  React.useEffect(() => {
    function onFullscreenChange() {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const fullscreenEl = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsBrowserFullscreen(fullscreenEl != null);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const requestBrowserFullscreen = React.useCallback(() => {
    const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    const req = root.requestFullscreen ?? root.webkitRequestFullscreen;
    if (typeof req !== "function") return;
    const p = req.call(root);
    if (p && typeof p.catch === "function") {
      p.catch((err: unknown) => {
        console.warn("Fullscreen request failed:", err);
      });
    }
  }, []);

  const exitBrowserFullscreen = React.useCallback(() => {
    const doc = document as Document & { exitFullscreen?: () => Promise<void>; webkitExitFullscreen?: () => Promise<void> };
    const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
    if (typeof exit === "function") exit().catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!settingsMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsMenuOpen]);

  React.useEffect(() => {
    if (!settingsMenuOpen) {
      setBybkSubmenuExpanded(false);
      setLogoutSubmenuExpanded(false);
    }
  }, [settingsMenuOpen]);

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

  const handleFeatureMediaClick = React.useCallback((mediaUrl: string) => {
    if (isVideoMediaUrl(mediaUrl)) {
      setMainVideoOverride(mediaUrl);
      setMainImageOverride(null);
    } else {
      setMainImageOverride(mediaUrl);
      setMainVideoOverride(null);
    }
  }, []);

  const handleSetMainImage = React.useCallback((url: string) => {
    setMainImageOverride(url);
    setMainVideoOverride(null);
  }, []);

  const wholesaleString = React.useMemo(
    () => getWholesaleStringThreeLines(rawItmGroupRows, selectedProduct?.itmGroupName ?? ""),
    [rawItmGroupRows, selectedProduct?.itmGroupName]
  );

  const handleSelectProductFromMain = React.useCallback((p: Product) => {
    setSelectionFromRecentList(false);
    setMainImageOverride(null);
    setMainVideoOverride(null);
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
    setMainVideoOverride(null);
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
    if (selectedCategory === BEST_CATEGORY) return getBestProducts(products);
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  /** When user clicks an item name in the Bybk (exchange price) table, select it in the main list and scroll into view. */
  const handleSelectProductByItmGroupName = React.useCallback(
    (itmGroupName: string) => {
      const p = filteredProducts.find((x) => x.itmGroupName === itmGroupName);
      if (p) {
        handleSelectProductFromMain(p);
        const safeId = `listItem_${itmGroupName.replace(/[.:]/g, "_")}`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => document.getElementById(safeId)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
        });
      }
    },
    [filteredProducts, handleSelectProductFromMain]
  );

  /** When Ultra box is open and a variant is selected, show mainItem.Variant.jpg; else use mainImageOverride (strip/feature). Show usual main image only when variant image 404s. */
  const effectiveMainImageOverride = React.useMemo(() => {
    if (ultraPriceBoxOpen && ultraSelectedVariant && selectedProduct?.itmGroupName) {
      const key = `${selectedProduct.itmGroupName}.${ultraSelectedVariant}`;
      if (variantImageFailed.has(key)) return null;
      return getImageUrl(`${selectedProduct.itmGroupName}.${ultraSelectedVariant}.jpg`);
    }
    return mainImageOverride;
  }, [ultraPriceBoxOpen, ultraSelectedVariant, selectedProduct?.itmGroupName, variantImageFailed, mainImageOverride]);

  const handleUltraPriceItemClick = React.useCallback((variant: "Ultra" | "Aristo" | "Base") => {
    setUltraSelectedVariant(variant);
  }, []);

  const handleExchangePriceClose = React.useCallback(() => setSelectedExchangeMenu(null), []);
  const handleUltraPriceClose = React.useCallback(() => setUltraPriceBoxOpen(false), []);

  const handleMainImageOverrideError = React.useCallback(() => {
    if (selectedProduct?.itmGroupName && ultraSelectedVariant) {
      setVariantImageFailed((prev) => new Set(prev).add(`${selectedProduct.itmGroupName}.${ultraSelectedVariant}`));
    }
  }, [selectedProduct?.itmGroupName, ultraSelectedVariant]);

  /** Category prefix from selected product (e.g. "Sv.Happy.1st" → "Sv") for filtering ForGroup images. */
  const categoryPrefix = React.useMemo(
    () =>
      selectedProduct?.itmGroupName
        ? (() => {
            const dot = selectedProduct.itmGroupName.indexOf(".");
            return dot >= 0 ? selectedProduct.itmGroupName.slice(0, dot) : selectedProduct.itmGroupName;
          })()
        : "",
    [selectedProduct?.itmGroupName]
  );
  /** Deferred category prefix: updates after delay so list click feels instant. CAT row only changes when category changes. */
  const DELAY_MS_STRIP = 120;
  const [deferredCategoryPrefix, setDeferredCategoryPrefix] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDeferredCategoryPrefix(categoryPrefix), DELAY_MS_STRIP);
    return () => clearTimeout(t);
  }, [categoryPrefix]);
  /** ETC: product for strip; deferred so main list selection stays snappy. */
  const [deferredProduct, setDeferredProduct] = React.useState<Product | null>(null);
  React.useEffect(() => {
    const t = setTimeout(() => setDeferredProduct(selectedProduct), DELAY_MS_STRIP);
    return () => clearTimeout(t);
  }, [selectedProduct]);
  const forGroupFiltered = React.useMemo(() => {
    if (!deferredCategoryPrefix) return [];
    const lower = deferredCategoryPrefix.toLowerCase();
    return barImages.forGroup.filter((f) => f.toLowerCase().startsWith(lower));
  }, [barImages.forGroup, deferredCategoryPrefix]);

  const additionalScrollRef = React.useRef<HTMLDivElement>(null);
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const commonScrollRef = React.useRef<HTMLDivElement>(null);
  const isSyncingStripScrollRef = React.useRef(false);
  const handleStripScroll = React.useCallback((source: "additional" | "category" | "common") => {
    if (isSyncingStripScrollRef.current) return;
    const refs = { additional: additionalScrollRef, category: categoryScrollRef, common: commonScrollRef };
    const el = refs[source].current;
    if (!el) return;
    const left = el.scrollLeft;
    isSyncingStripScrollRef.current = true;
    (["additional", "category", "common"] as const).forEach((key) => {
      if (key !== source && refs[key].current) refs[key].current!.scrollLeft = left;
    });
    requestAnimationFrame(() => {
      isSyncingStripScrollRef.current = false;
    });
  }, []);

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
      setMainVideoOverride(null);
      setSelectionFromRecentList(false);
    }
  }, [filteredProducts, selectedProduct?.itmGroupName, selectionFromRecentList]);

  return (
    <div
      id="divCatalogRoot"
      className="flex h-screen min-w-0 flex-col overflow-x-hidden bg-green-50 text-slate-800"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-300 bg-green-300 px-5 py-3 shadow-sm">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-green-700 p-1.5 text-white" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          Catalog
        </h1>
        <nav id="navCatalogHeader" aria-label="Catalog header">
          <Link
            id="linkAdmin"
            href="/admin"
            title="Admin"
            aria-label="Admin"
            className="flex items-center justify-center rounded-full bg-green-700 p-1.5 text-white transition-colors hover:bg-green-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </nav>
      </header>

      {imageSyncProgress && imageSyncProgress.total > 0 && (
        <div
          id="divImageSyncBar"
          className="flex shrink-0 items-center gap-2 border-b border-green-200 bg-teal-50 px-3 py-1.5 text-sm text-teal-700"
          aria-live="polite"
        >
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" aria-hidden />
          <span>
            {imageSyncProgress.message ?? `Syncing images ${imageSyncProgress.current}/${imageSyncProgress.total}`}
          </span>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 items-start overflow-hidden">
        {/* Left: category buttons only, stacked vertically */}
        <aside
          id="divCategoryStrip"
          className="flex w-14 shrink-0 flex-col self-stretch border-r border-green-200 bg-green-50/80"
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
                title="Best (only items with TargetSellingOrder)"
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
          <div id="divBrowserFullscreenSidebar" className="shrink-0 border-t border-green-200 p-1">
            {isBrowserFullscreen ? (
              <button
                type="button"
                id="btnExitBrowserFullscreen"
                onClick={exitBrowserFullscreen}
                className="flex w-full items-center justify-center gap-1 rounded p-2 text-slate-600 transition-colors hover:bg-green-100 hover:text-slate-800"
                title="Exit fullscreen (Esc)"
                aria-label="Exit fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden>
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                id="btnEnterBrowserFullscreen"
                onClick={requestBrowserFullscreen}
                disabled={!fullscreenSupported}
                className={`flex w-full items-center justify-center gap-1 rounded p-2 transition-colors ${
                  fullscreenSupported
                    ? "text-slate-600 hover:bg-green-100 hover:text-slate-800"
                    : "cursor-not-allowed text-slate-400"
                }`}
                title={fullscreenSupported ? "Fullscreen (Esc to exit)" : "Fullscreen not available (use HTTPS, not in iframe)"}
                aria-label="Enter fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            )}
          </div>
          {onRequestRefresh != null && (
            <div id="divSidebarSettings" className="shrink-0 border-t border-green-200 p-1" ref={settingsMenuRef}>
              <div id="divSettingsMenuContainer" className="relative">
                <button
                  type="button"
                  id="btnSettingsSidebar"
                  onClick={() => setSettingsMenuOpen((open) => !open)}
                  className="flex w-full items-center justify-center rounded p-2 text-slate-600 transition-colors hover:bg-green-100 hover:text-slate-800"
                  title="Settings"
                  aria-expanded={settingsMenuOpen}
                  aria-haspopup="true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                {settingsMenuOpen && (
                  <div
                    ref={settingsDropdownWrapperRef}
                    className="absolute left-full bottom-0 z-50 ml-1 flex items-end"
                    onMouseLeave={(e) => {
                      const wrapper = settingsDropdownWrapperRef.current;
                      const related = e.relatedTarget as Node | null;
                      if (wrapper && related && !wrapper.contains(related)) {
                        setBybkSubmenuExpanded(false);
                        setInfoSubmenuExpanded(false);
                        setLogoutSubmenuExpanded(false);
                      }
                    }}
                  >
                    <div
                      id="divSettingsDropdown"
                      role="menu"
                      className="min-w-[10rem] max-h-[70vh] overflow-y-auto border border-green-200 bg-white py-1 shadow-lg rounded-lg"
                    >
                      <div
                        id="divExchangePriceMenuSection"
                        role="group"
                        aria-labelledby="pExchangePriceMenuLabel"
                        aria-expanded={bybkSubmenuExpanded}
                        onMouseEnter={() => {
                          setInfoSubmenuExpanded(false);
                          setLogoutSubmenuExpanded(false);
                          setBybkSubmenuExpanded(true);
                        }}
                      >
                        <button
                          type="button"
                          id="btnBybkExchangePrice"
                          aria-expanded={bybkSubmenuExpanded}
                          aria-haspopup="true"
                          onClick={() => {
                            setInfoSubmenuExpanded(false);
                            setBybkSubmenuExpanded((v) => !v);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide rounded ${bybkSubmenuExpanded ? "bg-green-50 text-green-800" : "text-slate-600 hover:bg-green-50"}`}
                        >
                          <span id="pExchangePriceMenuLabel">Exchange price</span>
                          <span className="text-slate-400 shrink-0 ml-1" aria-hidden>›</span>
                        </button>
                      </div>
                      <div
                        id="divInfoMenuSection"
                        role="group"
                        aria-labelledby="pInfoMenuLabel"
                        aria-expanded={infoSubmenuExpanded}
                        onMouseEnter={() => {
                          setBybkSubmenuExpanded(false);
                          setLogoutSubmenuExpanded(false);
                          setInfoSubmenuExpanded(true);
                        }}
                      >
                        <button
                          type="button"
                          id="btnInfoMenu"
                          aria-expanded={infoSubmenuExpanded}
                          aria-haspopup="true"
                          onClick={() => {
                            setBybkSubmenuExpanded(false);
                            setInfoSubmenuExpanded((v) => !v);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide rounded ${infoSubmenuExpanded ? "bg-green-50 text-green-800" : "text-slate-600 hover:bg-green-50"}`}
                        >
                          <span id="pInfoMenuLabel">Info</span>
                          <span className="text-slate-400 shrink-0 ml-1" aria-hidden>›</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        id="btnSettingsUltraPrice"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                        onMouseEnter={() => {
                          setBybkSubmenuExpanded(false);
                          setInfoSubmenuExpanded(false);
                          setLogoutSubmenuExpanded(false);
                        }}
                        onClick={() => {
                          setSelectedExchangeMenu(null);
                          setUltraPriceBoxOpen(true);
                          setSettingsMenuOpen(false);
                        }}
                      >
                        <span>Aristo & Ultra</span>
                      </button>
                      <div className="border-t border-green-100 my-1" aria-hidden />
                      <button
                        type="button"
                        role="menuitem"
                        id="btnSettingsRefresh"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                        onMouseEnter={() => {
                          setBybkSubmenuExpanded(false);
                          setInfoSubmenuExpanded(false);
                          setLogoutSubmenuExpanded(false);
                        }}
                        onClick={async () => {
                          const ok = typeof window !== "undefined" && window.confirm("Refresh catalog and images from server? This may take a moment.");
                          if (!ok) return;
                          setSettingsMenuOpen(false);
                          await onRequestRefresh();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 21h5v-5" />
                        </svg>
                        Refresh
                      </button>
                      {(onLogout != null || onClearCache != null || onClearCacheAndLogout != null) && (
                        <>
                          <div className="border-t border-green-100 my-1" aria-hidden />
                          <div
                            id="divLogoutMenuSection"
                            role="group"
                            aria-labelledby="pLogoutMenuLabel"
                            aria-expanded={logoutSubmenuExpanded}
                            onMouseEnter={() => {
                              setBybkSubmenuExpanded(false);
                              setInfoSubmenuExpanded(false);
                              setLogoutSubmenuExpanded(true);
                            }}
                          >
                            <button
                              type="button"
                              id="btnLogoutMenu"
                              aria-expanded={logoutSubmenuExpanded}
                              aria-haspopup="true"
                              onClick={() => setLogoutSubmenuExpanded((v) => !v)}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide rounded ${logoutSubmenuExpanded ? "bg-green-50 text-green-800" : "text-slate-600 hover:bg-green-50"}`}
                            >
                              <span id="pLogoutMenuLabel">Logout</span>
                              <span className="text-slate-400 shrink-0 ml-1" aria-hidden>›</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {bybkSubmenuExpanded && (
                      <div
                        id="divBybkSubmenuFlyout"
                        role="menu"
                        aria-label="Exchange price options"
                        className="ml-1 min-w-[8rem] max-h-[70vh] overflow-y-auto overflow-x-hidden border border-green-200 bg-white py-1 shadow-lg rounded-lg"
                      >
                        {EXCHANGE_PRICE_SUBMENUS.map((item, idx) =>
                          item === "---" ? (
                            <div key={`sep-${idx}`} className="my-1 border-t border-green-100" aria-hidden />
                          ) : (
                            <button
                              key={item}
                              type="button"
                              role="menuitem"
                              id={`btnExchangePrice_${item.replace(/:/g, "_")}`}
                              className={`flex w-full items-center px-3 py-1.5 text-left text-sm rounded mx-0.5 ${selectedExchangeMenu === item ? "bg-green-100 text-green-900 font-medium" : "text-slate-700 hover:bg-green-50"}`}
                              onClick={() => {
                                setUltraPriceBoxOpen(false);
                                setSelectedExchangeMenu((prev) => (prev === item ? null : item));
                                setSettingsMenuOpen(false);
                              }}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>
                    )}
                    {infoSubmenuExpanded && (
                      <div
                        id="divInfoSubmenuFlyout"
                        role="menu"
                        aria-label="Info options"
                        className="ml-1 min-w-[8rem] max-h-[70vh] overflow-y-auto overflow-x-hidden border border-green-200 bg-white py-1 shadow-lg rounded-lg"
                      >
                        <div
                          role="menuitem"
                          id="divInfoShowWs"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                          aria-label="Wholesale price"
                        >
                          <span>Wholesale</span>
                          <button
                            type="button"
                            id="btnShowWsToggle"
                            role="switch"
                            aria-checked={showWs}
                            onClick={() => setShowWsAndPersist(!showWs)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${showWs ? "bg-green-600" : "bg-slate-200"}`}
                          >
                            <span
                              className={`inline-block h-4 w-3.5 rounded-full bg-white shadow-sm transition-transform ${showWs ? "translate-x-5" : "translate-x-0.5"}`}
                              style={{ marginTop: "2px" }}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <div
                          role="menuitem"
                          id="divInfoAll"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                          aria-label="Show product info box"
                        >
                          <span>All</span>
                          <button
                            type="button"
                            id="btnHideAllToggle"
                            role="switch"
                            aria-checked={!hideAll}
                            onClick={() => setHideAllAndPersist(!hideAll)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${!hideAll ? "bg-green-600" : "bg-slate-200"}`}
                          >
                            <span
                              className={`inline-block h-4 w-3.5 rounded-full bg-white shadow-sm transition-transform ${!hideAll ? "translate-x-5" : "translate-x-0.5"}`}
                              style={{ marginTop: "2px" }}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <div
                          role="menuitem"
                          id="divHidePrice"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                          aria-label="Hide price in product info"
                        >
                          <span>Price</span>
                          <button
                            type="button"
                            id="btnHidePriceToggle"
                            role="switch"
                            aria-checked={!hidePrice}
                            onClick={() => setHidePriceAndPersist(!hidePrice)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${!hidePrice ? "bg-green-600" : "bg-slate-200"}`}
                          >
                            <span
                              className={`inline-block h-4 w-3.5 rounded-full bg-white shadow-sm transition-transform ${!hidePrice ? "translate-x-5" : "translate-x-0.5"}`}
                              style={{ marginTop: "2px" }}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <div
                          role="menuitem"
                          id="divHideWarranty"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                          aria-label="Hide warranty in product info"
                        >
                          <span>Warranty</span>
                          <button
                            type="button"
                            id="btnHideWarrantyToggle"
                            role="switch"
                            aria-checked={!hideWarranty}
                            onClick={() => setHideWarrantyAndPersist(!hideWarranty)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${!hideWarranty ? "bg-green-600" : "bg-slate-200"}`}
                          >
                            <span
                              className={`inline-block h-4 w-3.5 rounded-full bg-white shadow-sm transition-transform ${!hideWarranty ? "translate-x-5" : "translate-x-0.5"}`}
                              style={{ marginTop: "2px" }}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </div>
                    )}
                    {logoutSubmenuExpanded && (onLogout != null || onClearCache != null || onClearCacheAndLogout != null) && (
                      <div
                        id="divLogoutSubmenuFlyout"
                        role="menu"
                        aria-label="Logout options"
                        className="ml-1 min-w-[10rem] max-h-[70vh] overflow-y-auto overflow-x-hidden border border-green-200 bg-white py-1 shadow-lg rounded-lg"
                      >
                        {onLogout != null && (
                          <button
                            type="button"
                            role="menuitem"
                            id="btnLogoutAction"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                            onClick={() => {
                              setSettingsMenuOpen(false);
                              setLogoutSubmenuExpanded(false);
                              onLogout();
                            }}
                          >
                            Logout
                          </button>
                        )}
                        {onClearCache != null && (
                          <button
                            type="button"
                            role="menuitem"
                            id="btnClearCacheAction"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                            onClick={async () => {
                              setSettingsMenuOpen(false);
                              setLogoutSubmenuExpanded(false);
                              await onClearCache();
                            }}
                          >
                            Clear cache
                          </button>
                        )}
                        {onClearCacheAndLogout != null && (
                          <button
                            type="button"
                            role="menuitem"
                            id="btnClearCacheAndLogoutAction"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50"
                            onClick={async () => {
                              setSettingsMenuOpen(false);
                              setLogoutSubmenuExpanded(false);
                              await onClearCacheAndLogout();
                            }}
                          >
                            Clear cache and logout
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Item part: section 1 = main list (full height), section 2 = 5-row recently viewed */}
        <div
          id="divItemPart"
          className="flex min-h-0 w-72 shrink-0 flex-col self-stretch border-r border-green-200 bg-white p-2"
        >
          <div
            id="divItemPartSection1"
            className="scrollbar-hide min-h-0 flex-1 overflow-auto rounded-lg border border-green-200 bg-green-50/50 p-2"
            aria-label={selectedCategory === BEST_CATEGORY ? "Items with TargetSellingOrder only" : "Item list"}
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

        <main className="flex min-h-0 min-w-0 max-h-full shrink-0 flex-1 flex-col overflow-hidden">
          <div
            id="divMainViewerScroll"
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            role="region"
            aria-label="Main product image"
          >
            <div
              id="divMainViewer"
              className="flex min-h-0 flex-1 flex-col border-b border-green-200 bg-green-50 p-4"
            >
              <div className="flex min-h-0 flex-1 flex-col" aria-hidden>
                <ProductViewer
                  product={selectedProduct}
                  mainImageOverride={effectiveMainImageOverride}
                  mainImageHoverPreview={mainImageHoverPreview}
                  mainVideoOverride={mainVideoOverride}
                  onOpenLightbox={openLightbox}
                  onMainImageOverrideError={handleMainImageOverrideError}
                  showBestBadgeOverlay={selectedExchangeMenu != null || ultraPriceBoxOpen}
                />
              </div>
            </div>
          </div>
          <div
            id="divBelowMainImageRows"
            className="flex shrink-0 flex-col min-w-0 border-t border-green-300 bg-green-300 pt-4 pb-4 mb-6"
            aria-label="Image strips (Etc, Cat, Gen)"
            onMouseLeave={() => setMainImageHoverPreview(null)}
          >
            <div id="divAdditionalImagesRow" className="flex min-w-0 shrink-0 items-stretch">
              <span className="flex w-12 shrink-0 items-center justify-center border-r border-green-300 bg-green-300 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-green-800" aria-hidden>Etc</span>
              <div
                id="divAdditionalImagesRowScroll"
                ref={additionalScrollRef}
                className="horizontal-scroll flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
                onScroll={() => handleStripScroll("additional")}
              >
                <AdditionalImagesStrip
                  product={deferredProduct}
                  onSetMainImage={handleSetMainImage}
                  onHoverMainImage={setMainImageHoverPreview}
                  onOpenLightbox={openLightbox}
                  compact
                />
              </div>
            </div>
            <div id="divCategoryImagesRow" className="flex min-w-0 shrink-0 items-stretch">
              <span className="flex w-12 shrink-0 items-center justify-center border-r border-green-300 bg-green-300 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-green-800" aria-hidden>Cat</span>
              <div
                id="divCategoryImagesRowScroll"
                ref={categoryScrollRef}
                className="horizontal-scroll flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
                onScroll={() => handleStripScroll("category")}
              >
                <ServerImagesStrip
                  ariaLabel="Category images (ForGroup)"
                  folder="ForGroup"
                  filenames={forGroupFiltered}
                  onSetMainImage={handleSetMainImage}
                  onHoverMainImage={setMainImageHoverPreview}
                  onOpenLightbox={openLightbox}
                  noTopBorder
                />
              </div>
            </div>
            <div id="divCommonImagesRow" className="flex min-w-0 shrink-0 items-stretch">
              <span className="flex w-12 shrink-0 items-center justify-center border-r border-green-300 bg-green-300 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-green-800" aria-hidden>Gen</span>
              <div
                id="divCommonImagesRowScroll"
                ref={commonScrollRef}
                className="strip-scroll-sync flex min-w-0 flex-1"
                onScroll={() => handleStripScroll("common")}
              >
                <ServerImagesStrip
                  ariaLabel="Common images (ForAll)"
                  folder="ForAll"
                  filenames={barImages.forAll}
                  onSetMainImage={handleSetMainImage}
                  onHoverMainImage={setMainImageHoverPreview}
                  onOpenLightbox={openLightbox}
                  noTopBorder
                />
              </div>
            </div>
          </div>
        </main>

        {!hideAll && (
          <aside
            id="divDetailsPanel"
            className="flex w-[30rem] shrink-0 flex-col self-stretch overflow-hidden border-l border-green-200 bg-green-50"
            aria-label="Product details"
          >
            <ProductDetails
              product={selectedProduct}
              features={features}
              exchangePriceMenu={selectedExchangeMenu}
              rawItmGroupRows={rawItmGroupRows}
              onFeatureMediaClick={handleFeatureMediaClick}
              onExchangePriceClose={handleExchangePriceClose}
              onSelectProductByItmGroupName={handleSelectProductByItmGroupName}
              ultraPriceOpen={ultraPriceBoxOpen}
              ultraRows={ultraRows}
              ultraPriceLoading={ultraPriceLoading}
              ultraPriceError={ultraPriceError}
              onUltraPriceClose={handleUltraPriceClose}
              onUltraPriceItemClick={handleUltraPriceItemClick}
              hidePrice={hidePrice}
              hideWarranty={hideWarranty}
            />
            {showWs && wholesaleString ? (
              <div
                id="divWholesalePriceRightSection"
                className="mt-auto min-w-0 shrink-0 border-t border-green-200 bg-green-100/80 px-3 py-2"
                aria-label="Wholesale prices"
              >
                <p className="text-[10px] font-medium text-slate-800 whitespace-pre-line">
                  {wholesaleString}
                </p>
              </div>
            ) : null}
          </aside>
        )}
      </div>

      <CommonImagesBar
        purpose="flash"
        lastUpdated={lastUpdated}
        dbVersion={dbVersion}
        appVersion={appVersion}
      />
      {lightboxImage && (
        <ImageLightbox
          imageSrc={lightboxImage.src}
          imageAlt={lightboxImage.alt}
          onClose={() => {
            setLightboxImage(null);
            setMainImageOverride(null);
          }}
        />
      )}
    </div>
  );
}
