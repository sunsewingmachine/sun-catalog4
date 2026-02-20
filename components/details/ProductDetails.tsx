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
        className="flex flex-1 flex-col overflow-auto p-4 text-zinc-500"
      >
        <p>Select a product</p>
        {lastUpdated && (
          <p className="mt-4 text-xs text-zinc-400">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return (
    <div
      id="divDetailsContent"
      className="flex flex-1 flex-col overflow-auto p-4"
    >
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium text-zinc-500">Company</dt>
          <dd className="text-zinc-800">{product.company}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Model</dt>
          <dd className="text-zinc-800">{product.model}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Price</dt>
          <dd className="text-zinc-800">{product.price}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Warranty</dt>
          <dd className="text-zinc-800">{product.warranty}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">PCode</dt>
          <dd className="font-mono text-zinc-800">{product.pCode}</dd>
        </div>
        {product.description && (
          <div>
            <dt className="font-medium text-zinc-500">Description</dt>
            <dd className="text-zinc-700">{product.description}</dd>
          </div>
        )}
      </dl>
      {lastUpdated && (
        <footer className="mt-auto border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-400">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        </footer>
      )}
    </div>
  );
}
