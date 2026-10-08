import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { shippingFor, slugify } from "@bookstore/shared";
import { db } from "./client";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import {
  AUTHORS,
  BOOKS,
  GENRES,
  REVIEW_SNIPPETS,
  SAMPLE_ADDRESSES,
  SAMPLE_CUSTOMERS,
} from "./seed-data";
import { authors, bookGenres, books, genres, orderItems, orders, reviews, users } from "./schema";

/** Small deterministic PRNG so every reset produces the same demo data. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const coverUrl = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

/** Wipe all data and load the starter catalog, demo accounts, reviews and order history. */
export async function seed() {
  const random = rng(42);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`truncate table order_items, orders, cart_items, reviews, book_genres, books, genres, authors, users restart identity cascade`,
    );

    // Users: two demo accounts with public passwords, plus sample customers who can't sign in.
    const demoRows = await tx
      .insert(users)
      .values(
        await Promise.all(
          Object.values(DEMO_ACCOUNTS).map(async (a) => ({
            name: a.name,
            email: a.email,
            role: a.role,
            isDemo: true,
            passwordHash: await bcrypt.hash(a.password, 10),
          })),
        ),
      )
      .returning();
    const lockedHash = await bcrypt.hash(crypto.randomUUID(), 10);
    const customerRows = await tx
      .insert(users)
      .values(
        SAMPLE_CUSTOMERS.map((name) => ({
          name,
          email: `${slugify(name).replace(/-/g, ".")}@example.com`,
          passwordHash: lockedHash,
        })),
      )
      .returning();
    const demoCustomer = demoRows.find((u) => u.role === "CUSTOMER")!;

    const genreRows = await tx
      .insert(genres)
      .values(GENRES.map((name) => ({ name, slug: slugify(name) })))
      .returning();
    const genreId = new Map(genreRows.map((g) => [g.name, g.id]));

    const authorRows = await tx
      .insert(authors)
      .values(Object.entries(AUTHORS).map(([name, bio]) => ({ name, bio })))
      .returning();
    const authorId = new Map(authorRows.map((a) => [a.name, a.id]));

    const bookRows = await tx
      .insert(books)
      .values(
        BOOKS.map((b) => ({
          title: b.title,
          slug: slugify(b.title),
          isbn: b.isbn,
          description: b.description,
          priceCents: Math.round(b.price * 100),
          stock: b.stock,
          coverUrl: coverUrl(b.isbn),
          publishedDate: b.published,
          pages: b.pages,
          featured: b.featured ?? false,
          seeded: true,
          authorId: authorId.get(b.author)!,
        })),
      )
      .returning();

    await tx
      .insert(bookGenres)
      .values(
        BOOKS.flatMap((b, i) =>
          b.genres.map((g) => ({ bookId: bookRows[i]!.id, genreId: genreId.get(g)! })),
        ),
      );

    // Reviews: most books get a handful, skewed positive like real storefronts.
    const reviewValues: (typeof reviews.$inferInsert)[] = [];
    for (const book of bookRows) {
      const reviewers = [...customerRows]
        .sort(() => random() - 0.5)
        .slice(0, Math.floor(random() * 6));
      for (const reviewer of reviewers) {
        const r = random();
        const rating = r < 0.5 ? 5 : r < 0.8 ? 4 : r < 0.93 ? 3 : r < 0.98 ? 2 : 1;
        reviewValues.push({
          userId: reviewer.id,
          bookId: book.id,
          rating,
          body: pick(REVIEW_SNIPPETS[rating]!),
          createdAt: new Date(Date.now() - Math.floor(random() * 120) * 86_400_000),
        });
      }
    }
    if (reviewValues.length) await tx.insert(reviews).values(reviewValues);

    // Orders spread over the last 30 days so the admin dashboard chart has data.
    const buyers = [...customerRows, demoCustomer, demoCustomer];
    for (let i = 0; i < 48; i++) {
      const buyer = pick(buyers);
      const lineCount = 1 + Math.floor(random() * 3);
      const chosen = [...new Set(Array.from({ length: lineCount }, () => pick(bookRows)))];
      const lines = chosen.map((b) => ({ book: b, quantity: 1 + Math.floor(random() * 2) }));
      const subtotalCents = lines.reduce((s, l) => s + l.book.priceCents * l.quantity, 0);
      const shippingCents = shippingFor(subtotalCents);
      const daysAgo = Math.floor(random() * 30);
      const createdAt = new Date(
        Date.now() - daysAgo * 86_400_000 - Math.floor(random() * 86_400_000),
      );
      const status =
        daysAgo > 10
          ? "DELIVERED"
          : daysAgo > 4
            ? "SHIPPED"
            : random() < 0.1
              ? "CANCELLED"
              : "PAID";
      const address = pick(SAMPLE_ADDRESSES);
      const [order] = await tx
        .insert(orders)
        .values({
          userId: buyer.id,
          status,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          shipFullName: buyer.name,
          shipLine1: address.line1,
          shipCity: address.city,
          shipPostalCode: address.postalCode,
          shipCountry: address.country,
          createdAt,
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order!.id,
          bookId: l.book.id,
          title: l.book.title,
          unitPriceCents: l.book.priceCents,
          quantity: l.quantity,
        })),
      );
    }
  });

  return { books: BOOKS.length, authors: Object.keys(AUTHORS).length, genres: GENRES.length };
}
