/**
 * API route: validates activation code against master codes (salkal, sxjllda),
 * APP_ACTIVATION_CODE1/APP_ACTIVATION_CODE2, or the time-based code. Keeps env codes server-side only.
 */

import { NextResponse } from "next/server";
import { validateActivationCode } from "@/lib/activationValidator";

/** Master activation codes that always accept (no env required). */
const MASTER_ACTIVATION_CODES = ["salkal", "sxjllda"];

function getStaticActivationCodes(): string[] {
  const c1 = process.env.APP_ACTIVATION_CODE1?.trim();
  const c2 = process.env.APP_ACTIVATION_CODE2?.trim();
  const fromEnv: string[] = [];
  if (c1) fromEnv.push(c1);
  if (c2) fromEnv.push(c2);
  const combined = [...MASTER_ACTIVATION_CODES, ...fromEnv];
  const seen = new Set<string>();
  return combined.filter((c) => {
    const u = (c ?? "").toUpperCase();
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
  const entered = (body.code ?? "").replace(/\s/g, "").trim();
  if (!entered) {
    return NextResponse.json(
      { valid: false, error: "Code is required" },
      { status: 400 }
    );
  }

  const enteredUpper = entered.toUpperCase();
  const staticCodes = getStaticActivationCodes();
  for (const envCode of staticCodes) {
    if (enteredUpper === (envCode ?? "").toUpperCase()) {
      return NextResponse.json({ valid: true });
    }
  }

  const result = validateActivationCode(entered);
  return NextResponse.json({
    valid: result.valid,
    error: result.error,
    decodedPcName: result.decodedPcName,
  });
}
