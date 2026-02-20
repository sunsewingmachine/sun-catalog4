"use client";

/**
 * Right panel: Company, Model, Price, Warranty, PCode, Description. Scrollable.
 */

import type { Product } from "@/types/product";

interface ProductDetailsProps {
  product: Product | null;
  lastUpdated: string | null;
}

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
      <dl className="space-y-3 text-sm">
        {[
          { term: "Company", value: product.company },
          { term: "Model", value: product.model },
          { term: "Price", value: product.price },
          { term: "Warranty", value: product.warranty },
          { term: "PCode", value: product.pCode, mono: true },
        ].map(({ term, value, mono }) => (
          <div key={term} className="rounded-lg bg-white/90 px-3 py-2 shadow-sm">
            <dt className="font-medium text-teal-700">{term}</dt>
            <dd className={mono ? "font-mono text-slate-800" : "text-slate-800"}>{value}</dd>
          </div>
        ))}
        {product.description && (
          <div className="rounded-lg bg-white/90 px-3 py-2 shadow-sm">
            <dt className="font-medium text-teal-700">Description</dt>
            <dd className="text-slate-700">{product.description}</dd>
          </div>
        )}
      </dl>
      {lastUpdated && (
        <footer className="mt-auto border-t border-green-200 pt-4">
          <p className="text-xs text-slate-400">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        </footer>
      )}
    </div>
  );
}
