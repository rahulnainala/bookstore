/** Flat-rate shipping, free above the threshold. Used by both the API and the UI. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 3500;
export const SHIPPING_FLAT_CENTS = 499;

export function shippingFor(subtotalCents: number): number {
  if (subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return SHIPPING_FLAT_CENTS;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
