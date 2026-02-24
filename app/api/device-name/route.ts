/**
 * API route: returns the exact device/PC name (server hostname).
 * Used on the activation screen so the displayed name is the real machine name, not a fake id.
 * When os.hostname() returns an IP (e.g. link-local 169.254.x.x), prefer COMPUTERNAME on Windows.
 */

import { NextResponse } from "next/server";
import os from "os";

/** True if the string looks like an IPv4 address (e.g. 169.254.68.81). */
function looksLikeIPv4(s: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s.trim());
}

export async function GET() {
  let deviceName = (os.hostname() ?? "").trim();
  if (!deviceName) deviceName = "PC";
  if (looksLikeIPv4(deviceName)) {
    const computerName = process.env.COMPUTERNAME?.trim();
    if (computerName) deviceName = computerName;
  }
  return NextResponse.json({ deviceName: deviceName || "PC" });
}
