/**
 * API route: returns filenames of images and videos in the Cloudflare R2 testimonials folder
 * (same path prefix as ForAll/ForGroup). Client uses getTestimonialsMediaUrl() for CDN URLs.
 */

import { NextResponse } from "next/server";
import { listKeysByPrefix, getTestimonialsFolderListPrefix } from "@/lib/r2ListHelper";

const VIDEO_EXT = /\.(mp4|webm|mov|ogg|m4v|avi|mn4)$/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

export interface TestimonialsListResponse {
  files: string[];
}

export async function GET(): Promise<NextResponse<TestimonialsListResponse>> {
  try {
    const prefix = getTestimonialsFolderListPrefix();
    const keys = await listKeysByPrefix(prefix);
    const files = keys.filter(
      (name) => IMAGE_EXT.test(name) || VIDEO_EXT.test(name)
    );
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
