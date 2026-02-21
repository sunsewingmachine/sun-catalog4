"use client";

/**
 * Right panel (last column): product info, Features box, exchange price table (when menu selected).
 * Disclaimer is shown in the bottom bar (CommonImagesBar).
 */

import React from "react";
import type { Product } from "@/types/product";
import type { FeatureRecord } from "@/types/feature";
import FeaturesBox from "./FeaturesBox";
import { getExchangePriceRows, getExchangePriceItemHeaderLabel } from "@/lib/exchangePriceHelper";
import { getUltraRowWithPrices, getMrpByItmGroupName, getDiscountByItmGroupName, type UltraRow } from "@/lib/ultraPriceHelper";

interface ProductDetailsProps {
  product: Product | null;
  features?: FeatureRecord[];
  /** When set (e.g. C1:Sv), show exchange price table instead of best quality box; data from cache only (rawItmGroupRows). */
  exchangePriceMenu?: string | null;
  /** Raw ItmGroup rows from cache (IndexedDB); row index 1 = header. No server fetch for exchange price. */
  rawItmGroupRows?: string[][];
  /** When user clicks a feature with url (col C), show that media in main viewer. */
  onFeatureMediaClick?: (mediaUrl: string) => void;
  /** When user closes/hides the exchange price panel. */
  onExchangePriceClose?: () => void;
  /** When true, show Ultra price box listing column A from sheet NEXT_PUBLIC_ULTRA_GID. */
  ultraPriceOpen?: boolean;
  /** Ultra sheet rows (cols A,B,C,D); used to show items and MRP/parts total from main DB. */
  ultraRows?: UltraRow[];
  /** True while Ultra sheet is being fetched. */
  ultraPriceLoading?: boolean;
  /** Error message if Ultra sheet fetch failed. */
  ultraPriceError?: string | null;
  /** When user closes the Ultra price panel. */
  onUltraPriceClose?: () => void;
  /** When user clicks an item name in the exchange price (Bybk) table, select that item in the main list. */
  onSelectProductByItmGroupName?: (itmGroupName: string) => void;
}

const ICON_CLASS = "size-4 shrink-0 text-slate-600";

const fieldIcons: Record<string, React.ReactNode> = {
  Company: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  Model: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    </svg>
  ),
  Price: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Warranty: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  PCode: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  ),
  Description: (
    <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
};

const FIELDS = [
  { term: "Company", fieldKey: "company" as const },
  { term: "Model", fieldKey: "model" as const },
  { term: "Price", fieldKey: "price" as const },
  { term: "Warranty", fieldKey: "warranty" as const },
  { term: "PCode", fieldKey: "pCode" as const, mono: true },
] as const;

export default function ProductDetails({
  product,
  features = [],
  exchangePriceMenu = null,
  rawItmGroupRows,
  onFeatureMediaClick,
  onExchangePriceClose,
  ultraPriceOpen = false,
  ultraRows = [],
  ultraPriceLoading = false,
  ultraPriceError = null,
  onUltraPriceClose,
  onSelectProductByItmGroupName,
}: ProductDetailsProps) {
  const hasRawRows = Array.isArray(rawItmGroupRows) && rawItmGroupRows.length > 0;
  const exchangeRows = exchangePriceMenu && hasRawRows ? getExchangePriceRows(rawItmGroupRows, exchangePriceMenu) : [];
  const exchangeItemHeader = exchangePriceMenu ? getExchangePriceItemHeaderLabel(exchangePriceMenu) : "Item";
  if (exchangePriceMenu && typeof console !== "undefined" && console.warn) {
    console.warn("[ExchangePrice] ProductDetails: rawItmGroupRows =", rawItmGroupRows == null ? "undefined" : Array.isArray(rawItmGroupRows) ? `array length ${rawItmGroupRows.length}` : typeof rawItmGroupRows, "hasRawRows =", hasRawRows, "exchangeRows.length =", exchangeRows.length, "exchangePriceMenu =", exchangePriceMenu);
  }
  const exchangeNoDataReason = !hasRawRows
    ? "Exchange price data is not in cache. Use Settings → Refresh to load the sheet (including row 2 headers), then try again."
    : `No item names found. Check that row 2 has a header "ItmGroupName" and that data rows (row 3+) have values in that column.`;
  if (!product) {
    return (
      <div
        id="divDetailsContent"
        className="scrollbar-hide flex flex-1 flex-col overflow-auto p-4 text-slate-500"
      >
        <p>Select a product</p>
      </div>
    );
  }
  if (ultraPriceOpen) {
    return (
      <div
        id="divDetailsContent"
        className="scrollbar-hide flex flex-1 flex-col overflow-hidden p-4 min-h-0"
      >
        <div
          id="divDetailsUltraPrice"
          className="flex flex-1 flex-col min-h-0 rounded-lg border border-green-200 bg-green-50/80 overflow-hidden"
          aria-label="Ultra price"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-1 border-b border-teal-700 bg-teal-600">
            <h3 id="h3UltraPriceTitle" className="text-xs font-semibold text-white">
              Ultra price{product?.itmGroupName ? ` (${product.itmGroupName})` : ""}
            </h3>
            {onUltraPriceClose ? (
              <button
                type="button"
                id="btnUltraPriceClose"
                onClick={onUltraPriceClose}
                className="rounded p-1 text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1"
                aria-label="Close Ultra price"
                title="Close"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="scrollbar-hide flex flex-1 min-h-0 overflow-auto px-2 py-1">
            {ultraPriceLoading ? (
              <p id="pUltraPriceLoading" className="py-2 text-sm text-slate-500">Loading…</p>
            ) : ultraPriceError ? (
              <p id="pUltraPriceError" className="py-2 text-sm text-red-600">{ultraPriceError}</p>
            ) : ultraRows.length === 0 ? (
              <p id="pUltraPriceEmpty" className="py-2 text-sm text-slate-500">No rows in Ultra sheet. Set NEXT_PUBLIC_ULTRA_GID to the sheet tab GID.</p>
            ) : (() => {
              const groups = ultraRows.reduce<UltraRow[][]>((acc, row) => {
                const isLineGap = (row[0] ?? "").trim().toLowerCase() === "linegap";
                if (isLineGap) {
                  acc.push([]);
                } else {
                  if (acc.length === 0) acc.push([]);
                  acc[acc.length - 1].push(row);
                }
                return acc;
              }, []).filter((g) => g.length > 0);
              const hasRawRows = Array.isArray(rawItmGroupRows) && rawItmGroupRows.length > 0;
              const selectedItemMrp = product && hasRawRows ? getMrpByItmGroupName(rawItmGroupRows, product.itmGroupName) : 0;
              const lessSvStandTableMrp = hasRawRows ? getMrpByItmGroupName(rawItmGroupRows, "less.svstandtable") : 0;
              return (
                <div id="listUltraPriceColA" className="flex flex-col gap-2 w-full" aria-label="Ultra price items and MRP">
                  {groups.map((group, gi) => (
                    <div
                      key={`ultra-group-${gi}`}
                      id={`divUltraGroup_${gi}`}
                      className="rounded-lg border border-green-200 bg-green-50/80 p-2"
                    >
                      <div
                        id={`divUltraGroupHeader_${gi}`}
                        className="flex w-full flex-row items-center gap-2 rounded px-1.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        <span className="min-w-0 flex-1 truncate">Model</span>
                        <span className="shrink-0 w-14 text-right">MRP</span>
                        <span className="shrink-0 w-14 text-right">Discount</span>
                        <span className="shrink-0 w-14 text-right">Price</span>
                      </div>
                      <ul className="list-none flex flex-col gap-1">
                        {group.map((row, ii) => {
                          const withPrices = getUltraRowWithPrices(row, hasRawRows ? rawItmGroupRows : undefined);
                          const mainLabel = withPrices.colA;
                          const partsTotal = withPrices.partsTotalMrp;
                          const threePlusSelected = partsTotal + selectedItemMrp - lessSvStandTableMrp;
                          const discountB = hasRawRows ? getDiscountByItmGroupName(rawItmGroupRows, withPrices.colB) : 0;
                          const discountC = hasRawRows ? getDiscountByItmGroupName(rawItmGroupRows, withPrices.colC) : 0;
                          const discountD = hasRawRows ? getDiscountByItmGroupName(rawItmGroupRows, withPrices.colD) : 0;
                          const selectedDiscount = product && hasRawRows ? getDiscountByItmGroupName(rawItmGroupRows, product.itmGroupName) : 0;
                          const totalDiscount = discountB + discountC + discountD + selectedDiscount;
                          const price = threePlusSelected - totalDiscount;
                          const mrpStr = hasRawRows ? (threePlusSelected > 0 ? String(Math.round(threePlusSelected)) : "—") : null;
                          const discountStr = hasRawRows ? (totalDiscount > 0 ? String(Math.round(totalDiscount)) : "—") : null;
                          const priceStr = hasRawRows ? String(Math.round(price)) : null;
                          return (
                            <li key={`ultra-a-${gi}-${ii}`} id={`liUltraColA_${gi}_${ii}`}>
                              <div
                                title={`${mainLabel} | MRP: ${threePlusSelected} | Discount: ${totalDiscount} (B+C+D+selected) | Price: ${price}`}
                                className="flex w-full flex-row items-center gap-2 rounded px-1.5 py-1 text-left text-sm font-medium bg-green-100 text-slate-700 hover:bg-green-200 transition-colors"
                              >
                                <span className="min-w-0 flex-1 truncate">{mainLabel}</span>
                                {mrpStr != null && (
                                  <span className="shrink-0 w-14 text-right text-xs text-slate-600 tabular-nums">{mrpStr}</span>
                                )}
                                {discountStr != null && (
                                  <span className="shrink-0 w-14 text-right text-xs text-slate-600 tabular-nums">{discountStr}</span>
                                )}
                                {priceStr != null && (
                                  <span className="shrink-0 w-14 text-right text-xs text-slate-600 tabular-nums">{priceStr}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="mt-4 shrink-0">
          <FeaturesBox product={product} features={features} onFeatureMediaClick={onFeatureMediaClick} />
        </div>
      </div>
    );
  }

  return (
    <div
      id="divDetailsContent"
      className="scrollbar-hide flex flex-1 flex-col overflow-auto p-4"
    >
      {!ultraPriceOpen && (
        <div
          id="divDetailsBox"
          className="rounded-lg border border-green-200 bg-green-100 p-3"
        >
          <dl
            id="dlProductDetails"
            className="grid grid-cols-[max-content_1ch_1fr] gap-x-2 gap-y-1.5 text-lg"
          >
          {FIELDS.map(({ term, fieldKey, mono }) => (
            <React.Fragment key={term}>
              <dt className="flex items-center gap-1.5 text-slate-900">
                <span className="flex shrink-0" aria-hidden>
                  {fieldIcons[term]}
                </span>
                {term}
              </dt>
              <span className="text-slate-900" aria-hidden>
                :
              </span>
              <dd
                className={mono ? "font-mono text-slate-900" : "text-slate-900"}
              >
                {product[fieldKey]}
              </dd>
            </React.Fragment>
          ))}
          {product.description && (
            <>
              <dt className="flex items-center gap-1.5 text-slate-900">
                <span className="flex shrink-0" aria-hidden>
                  {fieldIcons.Description}
                </span>
                Description
              </dt>
              <span className="text-slate-900" aria-hidden>
                :
              </span>
              <dd className="text-slate-900">{product.description}</dd>
            </>
          )}
          </dl>
        </div>
      )}

      <FeaturesBox product={product} features={features} onFeatureMediaClick={onFeatureMediaClick} />

      {exchangePriceMenu != null ? (
        <div
          id="divDetailsExchangePrice"
          className="mt-4 flex flex-1 flex-col min-h-0 rounded-lg border border-green-200 bg-green-50/80 overflow-hidden"
          aria-label="Exchange price"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-1 border-b border-teal-700 bg-teal-600">
            <h3 id="h3ExchangePriceTitle" className="text-xs font-semibold text-white">
              {exchangeItemHeader}
            </h3>
            {onExchangePriceClose ? (
              <button
                type="button"
                id="btnExchangePriceClose"
                onClick={onExchangePriceClose}
                className="rounded p-1 text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1"
                aria-label="Close exchange price"
                title="Close"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="scrollbar-hide flex flex-1 min-h-0 overflow-auto px-2 py-1">
            <table id="tableExchangePrice" className="w-full min-w-0 border-collapse text-xs table-fixed" aria-label="Exchange price">
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-green-200 bg-green-100/80">
                  <th className="px-1.5 py-1 text-left font-semibold text-slate-800">Item</th>
                  <th className="px-1 py-1 text-right font-semibold text-slate-800">MRP</th>
                  <th className="px-1 py-1 text-right font-semibold text-slate-800">Less</th>
                  <th className="px-1 py-1 text-right font-semibold text-slate-800">Final</th>
                </tr>
              </thead>
              <tbody>
                {exchangeRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-1.5 py-1.5 text-slate-500 text-center">
                      {exchangeNoDataReason}
                    </td>
                  </tr>
                ) : (
                  exchangeRows.map((row, i) => {
                    const isLineGap = row.item.trim().toLowerCase() === "linegap";
                    if (isLineGap) {
                      return (
                        <tr key={`linegap-${i}`} id={`rowExchangeLineGap_${i}`} className="border-b border-green-200 bg-green-100/80" aria-hidden>
                          <td colSpan={4} className="px-1.5 py-1" />
                        </tr>
                      );
                    }
                    return (
                      <tr key={`${row.item}-${i}`} className="border-b border-green-100 hover:bg-green-50/50">
                        <td id={`cellExchangeItem_${i}`} className="max-w-[8rem] truncate px-1.5 py-1 text-slate-900 font-medium" title={row.item}>
                          {onSelectProductByItmGroupName ? (
                            <button
                              type="button"
                              onClick={() => onSelectProductByItmGroupName(row.item)}
                              className="text-left w-full min-w-0 truncate hover:text-teal-700 hover:underline focus:outline-none focus:ring-1 focus:ring-teal-500 rounded"
                            >
                              {row.item}
                            </button>
                          ) : (
                            row.item
                          )}
                        </td>
                        <td id={`cellExchangePrice_${i}`} className="whitespace-nowrap px-1 py-1 text-right text-slate-800">{row.price || "—"}</td>
                        <td id={`cellExchangeLess_${i}`} className="whitespace-nowrap px-1 py-1 text-right text-slate-800">{row.less || "—"}</td>
                        <td id={`cellExchangeFinal_${i}`} className="whitespace-nowrap px-1 py-1 text-right text-slate-900 font-medium">{row.final || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : product.af != null && product.af > 0 ? (
        <div
          id="divDetailsBestImage"
          className="mt-4 flex flex-1 min-h-[8rem] flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50/80 p-4"
        >
          <img
            src="/used/best.png"
            alt="Best"
            className="max-h-48 w-auto max-w-full object-contain"
            width={192}
            height={192}
          />
        </div>
      ) : null}

    </div>
  );
}
