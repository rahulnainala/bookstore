import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { MAX_QTY_PER_ITEM, type Cart, type CartMergeInput } from "@bookstore/shared";
import { db } from "../db/client";
import { books, cartItems } from "../db/schema";
import { badRequest, notFound } from "../lib/errors";
import { summariesByIds } from "./books";

export async function getCart(userId: number): Promise<Cart> {
  const rows = await db
    .select({ bookId: cartItems.bookId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.bookId));
  const bookMap = await summariesByIds(rows.map((r) => r.bookId));
  const items = rows.flatMap((r) => {
    const book = bookMap.get(r.bookId);
    return book ? [{ bookId: r.bookId, quantity: r.quantity, book }] : [];
  });
  return {
    items,
    subtotalCents: items.reduce((sum, i) => sum + i.quantity * i.book.priceCents, 0),
  };
}

/** Set the quantity for one book. Quantity is capped by stock so the cart never promises too much. */
export async function setCartItem(userId: number, bookId: number, quantity: number) {
  const book = await db.query.books.findFirst({
    where: eq(books.id, bookId),
    columns: { stock: true },
  });
  if (!book) throw notFound("Book");
  if (book.stock === 0) throw badRequest("This book is out of stock", "OUT_OF_STOCK");
  const qty = Math.min(quantity, book.stock, MAX_QTY_PER_ITEM);
  await db
    .insert(cartItems)
    .values({ userId, bookId, quantity: qty })
    .onConflictDoUpdate({ target: [cartItems.userId, cartItems.bookId], set: { quantity: qty } });
  return getCart(userId);
}

export async function removeCartItem(userId: number, bookId: number) {
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.bookId, bookId)));
  return getCart(userId);
}

/**
 * Merge a guest (localStorage) cart into the signed-in user's cart. Quantities add up, capped by
 * stock and the per-item limit; unknown or sold-out books are dropped silently.
 */
export async function mergeCart(userId: number, input: CartMergeInput) {
  const wanted = new Map<number, number>();
  for (const { bookId, quantity } of input.items) {
    wanted.set(bookId, (wanted.get(bookId) ?? 0) + quantity);
  }
  if (wanted.size > 0) {
    const stock = await db
      .select({ id: books.id, stock: books.stock })
      .from(books)
      .where(inArray(books.id, [...wanted.keys()]));
    const values = stock
      .filter((b) => b.stock > 0)
      .map((b) => ({
        userId,
        bookId: b.id,
        quantity: Math.min(wanted.get(b.id)!, b.stock, MAX_QTY_PER_ITEM),
      }));
    if (values.length) {
      await db
        .insert(cartItems)
        .values(values)
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.bookId],
          set: {
            quantity: sql`least(${cartItems.quantity} + excluded.quantity, ${MAX_QTY_PER_ITEM}, (select stock from books where books.id = excluded.book_id))`,
          },
        });
    }
  }
  return getCart(userId);
}
