"use client";

/**
 * Right panel: Company, Model, Price, Warranty, PCode, Description. Scrollable.
 * Key-value rows with icons before titles and colons vertically aligned. Single background.
 */

import React from "react";
import type { Product } from "@/types/product";

interface ProductDetailsProps {
  product: Product | null;
  lastUpdated: string | null;
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
  lastUpdated,
}: ProductDetailsProps) {
  if (!product) {
    return (
      <div
        id="divDetailsContent"
        className="scrollbar-hide flex flex-1 flex-col overflow-auto p-4 text-slate-500"
      >
        <p>Select a product</p>
        {lastUpdated && (
          <p className="mt-4 text-xs text-slate-400">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return (
    <div
      id="divDetailsContent"
      className="scrollbar-hide flex flex-1 flex-col overflow-auto p-4"
    >
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
        {lastUpdated && (
          <footer className="mt-4 border-t border-green-200 pt-3">
            <p className="text-xs text-slate-400">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
