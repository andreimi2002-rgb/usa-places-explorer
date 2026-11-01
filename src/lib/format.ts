import type { ISODate } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-15" → "Sep 2026". Parsed by hand to avoid time-zone shifts. */
export function formatMonthYear(date: ISODate | null): string | null {
  if (!date) return null;
  const [year, month] = date.split('-');
  const m = month ? MONTHS[Number(month) - 1] : undefined;
  return m && year ? `${m} ${year}` : year ?? null;
}

/** "2026-09-15" → "Sep 15, 2026". */
export function formatFullDate(date: ISODate | null): string | null {
  if (!date) return null;
  const [year, month, day] = date.split('-');
  const m = month ? MONTHS[Number(month) - 1] : undefined;
  if (!m || !year) return year ?? null;
  return day ? `${m} ${Number(day)}, ${year}` : `${m} ${year}`;
}

export const formatNumber = (n: number) => n.toLocaleString('en-US');

export const pluralize = (n: number, one: string, many = `${one}s`) =>
  `${formatNumber(n)} ${n === 1 ? one : many}`;
