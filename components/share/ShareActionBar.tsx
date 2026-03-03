"use client";

/**
 * Action bar shown in place of the recently-viewed panel when share mode is active.
 * Displays share mode label, selected item count, a WhatsApp Send button, and a Cancel button.
 */

import type { ShareMode } from "@/lib/shareHelpers";

const SHARE_MAX_ITEMS = 10;

interface ShareActionBarProps {
  count: number;
  shareMode: ShareMode;
  onSend: () => void;
  onCancel: () => void;
}

const SHARE_MODE_LABELS: Record<ShareMode, string> = {
  image: "Share image",
  full: "Share image, price & warranty",
};

export default function ShareActionBar({ count, shareMode, onSend, onCancel }: ShareActionBarProps) {
  const title = SHARE_MODE_LABELS[shareMode];

  return (
    <div
      id="divShareActionBar"
      className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50/50 p-3"
    >
      {/* Share mode indicator */}
      <div id="divShareModeLabel" className="w-full rounded-md bg-green-100 px-2 py-1.5 text-center">
        <p id="pShareModeTitle" className="text-xs font-semibold text-green-800 leading-tight">{title}</p>
      </div>

      <p id="pShareSelectedCount" className="text-xs font-medium text-slate-500">
        {count === 0
          ? "No items selected"
          : `${count} / ${SHARE_MAX_ITEMS} item${count !== 1 ? "s" : ""} selected`}
      </p>
      {count >= SHARE_MAX_ITEMS && (
        <p id="pShareMaxReached" className="text-[10px] font-medium text-amber-600 text-center leading-tight">
          Max {SHARE_MAX_ITEMS} items reached
        </p>
      )}

      <button
        id="btnShareSendWhatsApp"
        type="button"
        disabled={count === 0}
        onClick={onSend}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          count === 0
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm"
        }`}
        title={count === 0 ? "Select at least one item" : "Send via WhatsApp"}
      >
        {/* WhatsApp icon */}
        <svg
          id="svgShareWhatsAppIcon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
        Send
      </button>

      <button
        id="btnShareCancel"
        type="button"
        onClick={onCancel}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
        title="Cancel share mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 shrink-0"
          aria-hidden
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        Cancel
      </button>
    </div>
  );
}
