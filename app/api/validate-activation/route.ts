/**
 * API route: validates activation code against APP_ACTIVATION_CODE1/APP_ACTIVATION_CODE2
 * or the time-based code. Keeps env codes server-side only.
 */

import { NextResponse } from "next/server";
import { validateActivationCode } from "@/lib/activationValidator";

function getStaticActivationCodes(): string[] {
  const c1 = process.env.APP_ACTIVATION_CODE1?.trim();
  const c2 = process.env.APP_ACTIVATION_CODE2?.trim();
  const codes: string[] = [];
  if (c1) codes.push(c1);
  if (c2) codes.push(c2);
  return codes;
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

  const staticCodes = getStaticActivationCodes();
  for (const envCode of staticCodes) {
    if (entered === envCode) {
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
