/**
 * Shared logic for time-based 13-digit code (for your code generator).
 * Same formula as activationValidator so generated codes validate in the app.
 */

function getTimeCodeForDate(date: Date): string {
  const minutes = date.getMinutes();
  const day = date.getDate();
  const salt = "SunCatalogActivation";
  const seed = `${salt}-${date.getFullYear()}-${date.getMonth()}-${day}-${minutes}`;
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

/**
 * Returns 13-digit time code for the given date (or now).
 */
export function getTimeCode(date?: Date): string {
  return getTimeCodeForDate(date ?? new Date());
}

/**
 * Build prefix for PC name: 3 random chars + char1 + 3 random + char2 + ...
 */
function buildPrefix(pcName: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const result: string[] = [];
  for (const c of pcName) {
    for (let i = 0; i < 3; i++) {
      result.push(chars[Math.floor(Math.random() * chars.length)] ?? "A");
    }
    result.push(c);
  }
  return result.join("");
}

/**
 * Full activation code for a PC at a given time: PREFIX + TIMECODE.
 * PC name is normalized to uppercase so the generated code is always in capital.
 */
export function generateActivationCode(
  pcName: string,
  date?: Date
): string {
  const normalizedName = (pcName ?? "").trim().toUpperCase();
  const prefix = buildPrefix(normalizedName);
  const timeCode = getTimeCode(date);
  return prefix + timeCode;
}
