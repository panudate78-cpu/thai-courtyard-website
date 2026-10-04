export function formatPrice(pence: number) {
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${(Math.abs(pence) / 100).toFixed(2)}`;
}

export function poundsToPence(value: string | number) {
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
}

/** Friendly, sequential order number shown to customers and staff. */
export function orderNumber(id: number) {
  return 1000 + id;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
