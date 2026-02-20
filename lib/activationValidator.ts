/**
 * Validates activation code: decode PC name from prefix (every 4th char), validate 13-digit time code.
 * No allowlist; secret/rule is in code only. If format valid and time matches, activate.
 */

import type { ActivationValidationResult } from "@/types/activation";

const TIMECODE_LENGTH = 13;

function decodePcNameFromPrefix(fullCode: string): string | null {
  const prefixLen = fullCode.length - TIMECODE_LENGTH;
  if (prefixLen < 4) return null;
  const pcChars: string[] = [];
  for (let i = 3; i < prefixLen; i += 4) pcChars.push(fullCode[i] ?? "");
  return pcChars.join("") || null;
}

function extractTimeCode(fullCode: string): string | null {
  if (fullCode.length < TIMECODE_LENGTH) return null;
  return fullCode.slice(-TIMECODE_LENGTH);
}

/**
 * Generate current time-based 13-digit code (reproducible: 3 + 2min + 3 + 2day + 3).
 * Secret in code: use a fixed salt so same minute+day produces same code. No env.
 */
function getCurrentTimeCode(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const day = now.getDate();
  const salt = "SunCatalogActivation";
  const seed = `${salt}-${now.getFullYear()}-${now.getMonth()}-${day}-${minutes}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  const r1 = (h % 900) + 100;
  const r2 = (Math.imul(h, 31) >>> 0) % 900 + 100;
  const r3 = (Math.imul(h, 37) >>> 0) % 900 + 100;
  const m = String(minutes).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${r1}${m}${r2}${d}${r3}`;
}

export function validateActivationCode(enteredCode: string): ActivationValidationResult {
  const code = (enteredCode ?? "").replace(/\s/g, "");
  if (code.length < TIMECODE_LENGTH + 4) {
    return { valid: false, error: "Code too short" };
  }

  const timeCode = extractTimeCode(code);
  if (!timeCode || timeCode.length !== TIMECODE_LENGTH || !/^\d{13}$/.test(timeCode)) {
    return { valid: false, error: "Invalid time code format" };
  }

  const decodedPcName = decodePcNameFromPrefix(code);
  if (!decodedPcName) {
    return { valid: false, error: "Invalid prefix" };
  }

  const expectedTimeCode = getCurrentTimeCode();
  if (timeCode !== expectedTimeCode) {
    return { valid: false, decodedPcName, error: "Code expired or invalid" };
  }

  return { valid: true, decodedPcName };
}
