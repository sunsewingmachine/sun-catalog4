/**
 * Helpers for WhatsApp sharing: builds structured text messages and triggers
 * Web Share API (with image files) or wa.me fallback for selected products.
 */

import type { Product } from "@/types/product";
import { getImageUrl } from "@/lib/r2ImageHelper";

export type ShareMode = "image" | "full";

/** Builds a structured WhatsApp text for a list of products. */
export function buildWhatsAppTextMessage(products: Product[], mode: ShareMode): string {
  return products
    .map((p) => {
      const imageUrl = getImageUrl(p.imageFilename, false);
      if (mode === "image") {
        return `${p.itmGroupName}\n${imageUrl}`;
      }
      const priceStr = p.price != null && p.price !== "" ? `₹${p.price}` : "N/A";
      const warrantyStr = p.warranty != null && p.warranty !== "" ? p.warranty : "N/A";
      return `*${p.itmGroupName}*\nPrice: ${priceStr}\nWarranty: ${warrantyStr}\nImage: ${imageUrl}`;
    })
    .join("\n\n");
}

/** Opens WhatsApp wa.me link with the message. Works on mobile and desktop (WhatsApp Web). */
function openWhatsApp(message: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Attempts Web Share API (with image files) for 'image' mode on supported browsers.
 * Falls back to wa.me text link on failure or unsupported browsers.
 * For 'full' mode always uses wa.me text link (includes image URLs inline).
 */
export async function shareProductsViaWhatsApp(
  products: Product[],
  mode: ShareMode
): Promise<void> {
  if (products.length === 0) return;

  const textMessage = buildWhatsAppTextMessage(products, mode);

  if (mode === "image" && typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const imageFiles = await fetchProductImageFiles(products);
      if (imageFiles.length > 0 && navigator.canShare({ files: imageFiles })) {
        await navigator.share({ files: imageFiles, title: "Products" });
        return;
      }
    } catch {
      // Fall through to wa.me fallback
    }
  }

  openWhatsApp(textMessage);
}

/** Fetches product images as File objects for Web Share API. Skips failed fetches silently. */
async function fetchProductImageFiles(products: Product[]): Promise<File[]> {
  const results = await Promise.allSettled(
    products.map(async (p) => {
      const url = getImageUrl(p.imageFilename, false);
      if (!url || !url.startsWith("http")) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const ext = p.imageFilename.split(".").pop() ?? "jpg";
      return new File([blob], `${p.itmGroupName}.${ext}`, { type: blob.type || "image/jpeg" });
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<File | null> => r.status === "fulfilled" && r.value != null)
    .map((r) => r.value as File);
}
