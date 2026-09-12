const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Turns "2026-09-05" into "5 September 2026".
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

// A fixed locale, so the server and the browser print the same text.
const formatters = new Map<number, Intl.NumberFormat>();

/** A number with thousands separators and a fixed number of decimals. */
export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  let formatter = formatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(digits, formatter);
  }
  return formatter.format(value);
}

/** A number with the given significant figures, for values that span decades
 *  (viscosity runs from 5 to 11,500 cP). */
export function formatSignificant(value: number, significant = 3): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const digits = Math.max(0, significant - 1 - Math.floor(Math.log10(Math.abs(value))));
  return formatNumber(value, digits);
}
