/**
 * Provenance helpers. A fact is shown only when `verified` holds a date;
 * everything else is treated as unknown on the page and surfaces in /status
 * and docs/REVIEW_REPORT.md instead.
 */
export interface ProvenancedFact<T = unknown> {
  value: T;
  source: string;
  verified: string | null;
  note?: string;
}

export const isVerified = <T>(fact: ProvenancedFact<T> | undefined | null): fact is ProvenancedFact<T> & { verified: string } =>
  Boolean(fact && fact.verified);

/** The value when verified, otherwise undefined. */
export const shown = <T>(fact: ProvenancedFact<T> | undefined | null): T | undefined =>
  isVerified(fact) ? fact.value : undefined;

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2010-10-01" → "October 1, 2010"; "1989-11" → "November 1989"; "1989" → "1989". */
export function formatDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  if (day && m) return `${MONTHS[m - 1]} ${day}, ${y}`;
  if (m) return `${MONTHS[m - 1]} ${y}`;
  return String(y);
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
