/**
 * Parses NEXT_PUBLIC_SHEET_ID and GID env values that may be either raw IDs
 * or full Google Sheet URLs (so prod works when env is set to a URL).
 */

const SHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$|\?|#)/;
const GID_REGEX = /[?&#]gid=(\d+)/i;

/**
 * Returns the sheet ID from a value that may be a raw ID or a full spreadsheet URL.
 */
export function parseSheetId(value: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(SHEET_ID_REGEX);
  if (match) return match[1];
  // Raw ID: alphanumeric, hyphens, underscores (no slashes or protocol)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return "";
}

/**
 * Returns the GID (numeric string) from a value that may be a raw number/gid or a URL with gid=.
 */
export function parseGid(value: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const urlMatch = trimmed.match(GID_REGEX);
  if (urlMatch) return urlMatch[1];
  // Raw numeric GID
  if (/^\d+$/.test(trimmed)) return trimmed;
  return "";
}
