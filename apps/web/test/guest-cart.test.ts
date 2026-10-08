import { describe, expect, it } from "vitest";
import type { BookSummary } from "@bookstore/shared";
import {
  addToGuestCart,
  readGuestCart,
  setGuestQty,
  subtotalOf,
  writeGuestCart,
} from "../src/lib/guest-cart";

const book = (id: number, stock = 20, priceCents = 1000): BookSummary => ({
  id,
  slug: `book-${id}`,
  title: `Book ${id}`,
  isbn: "9780000000000",
  priceCents,
  stock,
  coverUrl: null,
  featured: false,
  author: { id: 1, name: "Author" },
  genres: [],
  avgRating: null,
  reviewCount: 0,
});

describe("guest cart", () => {
  it("adds books and accumulates quantity", () => {
    let items = addToGuestCart([], book(1));
    items = addToGuestCart(items, book(1), 2);
    items = addToGuestCart(items, book(2, 20, 500));
    expect(items.map((i) => [i.bookId, i.quantity])).toEqual([
      [1, 3],
      [2, 1],
    ]);
    expect(subtotalOf(items)).toBe(3 * 1000 + 500);
  });

  it("caps quantity by stock and the per-item limit", () => {
    expect(addToGuestCart([], book(1, 2), 5)[0]!.quantity).toBe(2);
    expect(addToGuestCart([], book(1, 100), 50)[0]!.quantity).toBe(10);
  });

  it("removes an item when quantity drops to zero or it is sold out", () => {
    const items = addToGuestCart([], book(1));
    expect(setGuestQty(items, book(1), 0)).toEqual([]);
    expect(addToGuestCart([], book(3, 0))).toEqual([]);
  });

  it("round-trips through localStorage and ignores corrupt data", () => {
    const items = addToGuestCart([], book(1));
    writeGuestCart(items);
    expect(readGuestCart()).toEqual(items);
    localStorage.setItem("folio.cart", "{not json");
    expect(readGuestCart()).toEqual([]);
  });
});
