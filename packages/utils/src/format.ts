/**
 * Formats a number as Thai Baht currency.
 *
 * @param amount - The amount in Baht
 * @param options - Formatting options
 * @returns Formatted string, e.g. "฿1,500.00"
 *
 * @example
 * ```ts
 * formatPrice(1500)        // "฿1,500.00"
 * formatPrice(1500, { showSymbol: false }) // "1,500.00"
 * formatPrice(0)           // "฿0.00"
 * ```
 */
export function formatPrice(
  amount: number,
  options: { showSymbol?: boolean; decimals?: number } = {},
): string {
  const { showSymbol = true, decimals = 2 } = options;
  const formatted = amount.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `฿${formatted}` : formatted;
}

/**
 * Formats an ISO 8601 date string for Thai locale display.
 *
 * @param isoDate - ISO 8601 date string
 * @param style - Formatting style: "short" (1/3/69), "medium" (1 มี.ค. 2569), "long" (1 มีนาคม 2569)
 * @returns Formatted date string in Thai locale
 *
 * @example
 * ```ts
 * formatDate("2026-03-09T10:00:00Z")                  // "9 มี.ค. 2569"
 * formatDate("2026-03-09T10:00:00Z", "short")          // "9/3/69"
 * formatDate("2026-03-09T10:00:00Z", "long")           // "9 มีนาคม 2569"
 * ```
 */
export function formatDate(
  isoDate: string,
  style: 'short' | 'medium' | 'long' = 'medium',
): string {
  const date = new Date(isoDate);

  const styleMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: '2-digit', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
  };

  return date.toLocaleDateString('th-TH', styleMap[style]);
}

/**
 * Formats a datetime string for Thai locale display including time.
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted datetime string, e.g. "9 มี.ค. 2569, 10:00"
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a duration in minutes into a human-readable string.
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 *
 * @example
 * ```ts
 * formatDuration(90)   // "1 ชม. 30 น."
 * formatDuration(45)   // "45 น."
 * formatDuration(120)  // "2 ชม."
 * formatDuration(1440) // "1 วัน"
 * ```
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 น.';

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชม.`);
  if (mins > 0) parts.push(`${mins} น.`);

  return parts.join(' ');
}
