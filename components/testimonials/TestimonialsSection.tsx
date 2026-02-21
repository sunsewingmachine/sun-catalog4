"use client";

/**
 * Testimonials section for the catalog: fills remaining space below the main image and thumb strip.
 * Renders a scrollable list of customer testimonials; data can be replaced with API or CMS later.
 */

import React from "react";

export interface TestimonialEntry {
  id: string;
  quote: string;
  author: string;
  roleOrLocation?: string;
}

const PLACEHOLDER_TESTIMONIALS: TestimonialEntry[] = [
  {
    id: "t1",
    quote: "Excellent quality and reliable service. Very satisfied with our purchase.",
    author: "Customer",
    roleOrLocation: "Regular buyer",
  },
  {
    id: "t2",
    quote: "The product exceeded our expectations. Will recommend to others.",
    author: "Happy Client",
    roleOrLocation: "Dealer",
  },
  {
    id: "t3",
    quote: "Fast delivery and great support. Thank you!",
    author: "Business User",
    roleOrLocation: "Wholesale",
  },
];

interface TestimonialsSectionProps {
  /** Optional list of testimonials; uses placeholder data if not provided. */
  testimonials?: TestimonialEntry[];
}

export default function TestimonialsSection({
  testimonials = PLACEHOLDER_TESTIMONIALS,
}: TestimonialsSectionProps) {
  return (
    <section
      id="sectionTestimonials"
      className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-green-200 bg-green-50/80"
      aria-label="Customer testimonials"
    >
      <h2 className="shrink-0 px-4 py-2 text-sm font-semibold text-slate-700">
        What our customers say
      </h2>
      <div
        id="divTestimonialsScroll"
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 pb-4"
      >
        <ul className="flex flex-col gap-3" role="list">
          {testimonials.map((t) => (
            <li
              key={t.id}
              id={`liTestimonial-${t.id}`}
              className="rounded-xl border border-green-200 bg-white p-3 shadow-sm"
            >
              <blockquote className="text-sm text-slate-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <footer className="mt-2 text-xs text-slate-500">
                — {t.author}
                {t.roleOrLocation ? `, ${t.roleOrLocation}` : ""}
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
