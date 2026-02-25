/**
 * Shared logic for time-based 13-digit code (for your code generator).
 * Same formula as activationValidator so generated codes validate in the app.
 * Also provides PCBC- (PC-based) and DTBC- (date-time based) activation codes.
 */

const PCBC_PREFIX = "PCBC-";
const DTBC_PREFIX = "DTBC-";

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
 * Deterministic "random" digits from date seed: length 3, 5, 7, or 4.
 */
function getDeterministicDigits(seedBase: string, length: 3 | 4 | 5 | 7): string {
  let h = 0;
  const seed = seedBase + length;
  for (let i = 0; i < seed.length; i++)
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  const max = Math.pow(10, length);
  const n = (h >>> 0) % max;
  return String(n).padStart(length, "0");
}

/**
 * Date-time based code (DTBC): DTBC-r3mmr5ddr7HHr4MMr4 — use when host name may not work.
 * Uses UTC so the same code validates on server and client regardless of timezone.
 */
export function generateDateTimeBasedCode(date?: Date): string {
  const d = date ?? new Date();
  const salt = "SunCatalogDTBC";
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  const seedBase = `${salt}-${y}-${mo}-${day}-${hh}-${mm}`;

  const mmStr = String(mm).padStart(2, "0");
  const ddStr = String(day).padStart(2, "0");
  const hhStr = String(hh).padStart(2, "0");

  const r3 = getDeterministicDigits(seedBase + "r3", 3);
  const r5 = getDeterministicDigits(seedBase + "r5", 5);
  const r7 = getDeterministicDigits(seedBase + "r7", 7);
  const r4a = getDeterministicDigits(seedBase + "r4a", 4);
  const r4b = getDeterministicDigits(seedBase + "r4b", 4);

  return `${DTBC_PREFIX}${r3}${mmStr}${r5}${ddStr}${r7}${hhStr}${r4a}${mmStr}${r4b}`;
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
 * Full activation code for a PC at a given time: PCBC- + PREFIX + TIMECODE.
 * PC name is normalized to uppercase so the generated code is always in capital.
 */
export function generateActivationCode(
  pcName: string,
  date?: Date
): string {
  const normalizedName = (pcName ?? "").trim().toUpperCase();
  const prefix = buildPrefix(normalizedName);
  const timeCode = getTimeCode(date);
  return PCBC_PREFIX + prefix + timeCode;
}

export { PCBC_PREFIX, DTBC_PREFIX };
