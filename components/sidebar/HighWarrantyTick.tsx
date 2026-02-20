"use client";

/**
 * Tick icon with a vibrant "High warranty product" tooltip on hover. Rendered in a portal so it stays on top and is not clipped by list overflow.
 */

import React from "react";
import { createPortal } from "react-dom";

const TOOLTIP_WIDTH_PX = 176; // w-44
const GAP_PX = 4;

export default function HighWarrantyTick() {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipStyle, setTooltipStyle] = React.useState({ top: 0, left: 0 });
  const tickRef = React.useRef<HTMLSpanElement>(null);

  const updateTooltipPosition = React.useCallback(() => {
    const el = tickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltipStyle({
      top: rect.bottom + GAP_PX,
      left: Math.max(8, rect.right - TOOLTIP_WIDTH_PX),
    });
  }, []);

  React.useEffect(() => {
    if (!showTooltip) return;
    updateTooltipPosition();
    const raf = requestAnimationFrame(updateTooltipPosition);
    const interval = setInterval(updateTooltipPosition, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [showTooltip, updateTooltipPosition]);

  const handleEnter = React.useCallback(() => {
    const el = tickRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setTooltipStyle({
        top: rect.bottom + GAP_PX,
        left: Math.max(8, rect.right - TOOLTIP_WIDTH_PX),
      });
    }
    setShowTooltip(true);
  }, []);

  const handleLeave = React.useCallback(() => {
    setShowTooltip(false);
  }, []);

  const tooltipContent =
    typeof document !== "undefined" && showTooltip ? (
      <div
        id="spanHighWarrantyTooltip"
        role="tooltip"
        className="fixed z-[9999] flex w-44 flex-col items-center rounded-xl border-2 border-amber-400 bg-amber-50 p-3 shadow-lg ring-2 ring-amber-200 before:absolute before:bottom-full before:right-6 before:border-8 before:border-transparent before:border-b-amber-400 before:content-['']"
        style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <img
          src="/used/warranty.jpg"
          alt=""
          width={128}
          height={128}
          className="mb-2 h-32 w-32 shrink-0 rounded-lg object-cover"
          aria-hidden
        />
        <span className="text-center text-sm font-semibold leading-tight text-amber-900">
          High warranty product
        </span>
      </div>
    ) : null;

  return (
    <>
      <span
        ref={tickRef}
        id="spanHighWarrantyTick"
        className="relative inline-flex shrink-0"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <img
          src="/used/tick.png"
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px]"
          aria-hidden
        />
      </span>
      {typeof document !== "undefined" && tooltipContent
        ? createPortal(tooltipContent, document.body)
        : null}
    </>
  );
}
