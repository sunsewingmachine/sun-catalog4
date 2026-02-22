"use client";

/**
 * Shows a random sequence of images/videos from public/testimonials in the details panel.
 * Videos play to end; images display for 5 seconds. Fetches list from /api/testimonials.
 * Uses a slow opacity transition (2.5s) for fade in/out between items.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";

const IMAGE_DISPLAY_MS = 5000;
const FADE_DURATION_MS = 2500;
const VIDEO_EXT = /\.(mp4|webm|mov|ogg|m4v|avi|mn4)(\?|$)/i;

function isVideoFilename(filename: string): boolean {
  return VIDEO_EXT.test(filename);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function TestimonialsMediaStrip() {
  const [files, setFiles] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [key, setKey] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data: { files?: string[] }) => {
        if (cancelled || !Array.isArray(data.files)) return;
        setFiles(data.files);
        setShuffled(shuffle(data.files));
      })
      .catch(() => setFiles([]));
    return () => { cancelled = true; };
  }, []);

  const advanceIndex = useCallback(() => {
    if (shuffled.length === 0) return;
    setIndex((i) => (i + 1) % shuffled.length);
    setKey((k) => k + 1);
  }, [shuffled.length]);

  const goNext = useCallback(() => {
    if (shuffled.length === 0) return;
    setFadingOut(true);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      transitionTimeoutRef.current = null;
      advanceIndex();
      setFadingOut(false);
    }, FADE_DURATION_MS);
  }, [shuffled.length, advanceIndex]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (shuffled.length === 0) return;
    const filename = shuffled[index];
    if (!filename) return;
    if (isVideoFilename(filename)) {
      return;
    }
    const t = setTimeout(goNext, IMAGE_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [shuffled, index, goNext]);

  if (files.length === 0) return null;

  const filename = shuffled[index];
  if (!filename) return null;

  const src = `/testimonials/${encodeURIComponent(filename)}`;
  const isVideo = isVideoFilename(filename);

  return (
    <div
      id="divTestimonialsMediaStrip"
      className="flex min-h-[12rem] w-full flex-1 flex-col overflow-hidden rounded-lg bg-green-50/60"
      aria-label="Testimonials"
    >
      <div
        className="relative flex h-full min-h-0 w-full transition-opacity ease-in-out"
        style={{ opacity: fadingOut ? 0 : 1, transitionDuration: `${FADE_DURATION_MS}ms` }}
      >
        {isVideo ? (
          <video
            key={key}
            id="videoTestimonial"
            src={src}
            className="h-full min-h-0 w-full object-fill"
            controls
            playsInline
            onEnded={goNext}
            aria-label={`Testimonial video ${index + 1}`}
          />
        ) : (
          <img
            key={key}
            id="imgTestimonial"
            src={src}
            alt={`Testimonial ${index + 1}`}
            className="block h-full min-h-0 w-full object-fill"
          />
        )}
      </div>
    </div>
  );
}
