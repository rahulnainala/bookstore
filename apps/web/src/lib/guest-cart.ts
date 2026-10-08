import { MAX_QTY_PER_ITEM, type BookSummary, type CartItem } from "@bookstore/shared";

/** Cart kept in localStorage for visitors who haven't signed in. Pure helpers, easy to test. */
export const GUEST_CART_KEY = "folio.cart";

export function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.book && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items: CartItem[]) {
  try {
    if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Storage can be unavailable (private mode); the cart then lives only in memory.
  }
}

const clampQty = (qty: number, book: BookSummary) =>
  Math.max(0, Math.min(qty, MAX_QTY_PER_ITEM, book.stock));

export function setGuestQty(items: CartItem[], book: BookSummary, quantity: number): CartItem[] {
  const qty = clampQty(quantity, book);
  if (qty === 0) return items.filter((i) => i.bookId !== book.id);
  const existing = items.find((i) => i.bookId === book.id);
  if (existing) return items.map((i) => (i.bookId === book.id ? { ...i, book, quantity: qty } : i));
  return [...items, { bookId: book.id, quantity: qty, book }];
}

export function addToGuestCart(items: CartItem[], book: BookSummary, quantity = 1): CartItem[] {
  const current = items.find((i) => i.bookId === book.id)?.quantity ?? 0;
  return setGuestQty(items, book, current + quantity);
}

export const subtotalOf = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity * i.book.priceCents, 0);
