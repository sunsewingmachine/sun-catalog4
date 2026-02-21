/**
 * API route: returns image filenames for the bottom bar by listing ForAll and ForGroup folders
 * from R2/S3-compatible storage (same path as items folder in bucket). No static JSON.
 * Env: R2_*, optional NEXT_PUBLIC_CDN_BAR_PATH_PREFIX if ForAll/ForGroup sit under a path (e.g. same as items).
 */

import { NextResponse } from "next/server";
import {
  listKeysByPrefix,
  getBarFolderListPrefix,
  isR2ListConfigured,
} from "@/lib/r2ListHelper";

export interface BarImagesResponse {
  forAll: string[];
  forGroup: string[];
  /** Set when R2 env is missing so the client can show a hint. */
  _hint?: "r2_not_configured";
}

export async function GET(): Promise<NextResponse<BarImagesResponse>> {
  try {
    if (!isR2ListConfigured()) {
      return NextResponse.json({
        forAll: [],
        forGroup: [],
        _hint: "r2_not_configured",
      });
    }
    const [forAll, forGroup] = await Promise.all([
      listKeysByPrefix(getBarFolderListPrefix("ForAll")),
      listKeysByPrefix(getBarFolderListPrefix("ForGroup")),
    ]);
    return NextResponse.json({ forAll, forGroup });
  } catch {
    return NextResponse.json({ forAll: [], forGroup: [] });
  }
}
