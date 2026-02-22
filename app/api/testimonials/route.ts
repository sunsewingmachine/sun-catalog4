/**
 * API route: returns filenames of images and videos in public/testimonials
 * for the details panel testimonials strip. Client serves them from /testimonials/{filename}.
 */

import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

const VIDEO_EXT = /\.(mp4|webm|mov|ogg|m4v|avi|mn4)$/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

export interface TestimonialsListResponse {
  files: string[];
}

export async function GET(): Promise<NextResponse<TestimonialsListResponse>> {
  try {
    const dir = join(process.cwd(), "public", "testimonials");
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && (VIDEO_EXT.test(e.name) || IMAGE_EXT.test(e.name)))
      .map((e) => e.name);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
