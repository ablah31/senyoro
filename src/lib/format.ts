export const TIMEZONE = "Africa/Conakry";
export const CURRENCY = "GNF";

export function toAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function parsePriceInput(value: string): number {
  return toAmount(value.replace(/[\s\u00a0.,]/g, ""));
}

export function formatGNF(value: string | number | null | undefined): string {
  const amount = toAmount(value);
  const formatted = new Intl.NumberFormat("fr-GN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} GNF`;
}

export function formatNumber(value: string | number | null | undefined): string {
  return new Intl.NumberFormat("fr-GN", {
    maximumFractionDigits: 0,
  }).format(toAmount(value));
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} %`;
}
