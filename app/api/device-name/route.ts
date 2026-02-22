/**
 * API route: returns the exact device/PC name (server hostname).
 * Used on the activation screen so the displayed name is the real machine name, not a fake id.
 */

import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const deviceName = os.hostname() ?? "";
  return NextResponse.json({ deviceName: deviceName.trim() || "PC" });
}
