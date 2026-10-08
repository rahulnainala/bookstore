import { Router } from "express";
import { asc, count, desc, eq, lte, ne, sql } from "drizzle-orm";
import {
  authorInputSchema,
  bookInputSchema,
  genreInputSchema,
  idParam,
  orderStatusInputSchema,
  slugify,
  type AdminStats,
} from "@bookstore/shared";
import { db } from "../db/client";
import { authors, books, genres, orderItems, orders, users } from "../db/schema";
import { currentUser, requireAdmin } from "../lib/auth";
import { conflict, forbidden, notFound } from "../lib/errors";
import { parse } from "../lib/validate";
import { createBook, getBookById, updateBook } from "../services/books";
import { listOrders, updateOrderStatus } from "../services/orders";
import { pageQuery } from "./orders";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/stats", async (_req, res) => {
  const notCancelled = ne(orders.status, "CANCELLED");

  const [[totals], [customers], [bookTotal], salesByDay, topSellers, lowStock] = await Promise.all([
    db
      .select({
        revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(notCancelled),
    db.select({ n: count() }).from(users).where(eq(users.role, "CUSTOMER")),
    db.select({ n: count() }).from(books),
    db.execute<{ date: string; revenue_cents: number; orders: number }>(sql`
      select to_char(d.day, 'YYYY-MM-DD') as date,
             coalesce(sum(o.total_cents), 0)::int as revenue_cents,
             count(o.id)::int as orders
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') as d(day)
      left join orders o
        on o.created_at >= d.day and o.created_at < d.day + interval '1 day' and o.status <> 'CANCELLED'
      group by d.day
      order by d.day`),
    db
      .select({
        bookId: orderItems.bookId,
        title: orderItems.title,
        unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
        revenueCents: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceCents})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(notCancelled)
      .groupBy(orderItems.bookId, orderItems.title)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
    db
      .select({ bookId: books.id, title: books.title, stock: books.stock })
      .from(books)
      .where(lte(books.stock, 5))
      .orderBy(asc(books.stock), asc(books.title))
      .limit(8),
  ]);

  const stats: AdminStats = {
    revenueCents: totals?.revenueCents ?? 0,
    orderCount: totals?.orderCount ?? 0,
    customerCount: customers?.n ?? 0,
    bookCount: bookTotal?.n ?? 0,
    salesByDay: salesByDay.rows.map((r) => ({
      date: r.date,
      revenueCents: r.revenue_cents,
      orders: r.orders,
    })),
    topSellers: topSellers.map((t) => ({ ...t, bookId: t.bookId ?? 0 })),
    lowStock,
  };
  res.json(stats);
});

adminRouter.get("/books/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const book = await getBookById(id);
  res.json({ book });
});

adminRouter.post("/books", async (req, res) => {
  const book = await createBook(parse(bookInputSchema, req));
  res.status(201).json({ book });
});

adminRouter.put("/books/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  res.json({ book: await updateBook(id, parse(bookInputSchema, req)) });
});

adminRouter.delete("/books/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const book = await db.query.books.findFirst({
    where: eq(books.id, id),
    columns: { seeded: true },
  });
  if (!book) throw notFound("Book");
  // don't let the shared demo admin empty the store
  if (book.seeded && currentUser(req).isDemo) {
    throw forbidden(
      "The demo admin can't delete the starter catalog. Try deleting a book you added.",
    );
  }
  await db.delete(books).where(eq(books.id, id));
  res.status(204).end();
});

adminRouter.post("/authors", async (req, res) => {
  const [author] = await db.insert(authors).values(parse(authorInputSchema, req)).returning();
  res.status(201).json({ author });
});

adminRouter.put("/authors/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const [author] = await db
    .update(authors)
    .set(parse(authorInputSchema, req))
    .where(eq(authors.id, id))
    .returning();
  if (!author) throw notFound("Author");
  res.json({ author });
});

adminRouter.delete("/authors/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const [{ n } = { n: 0 }] = await db
    .select({ n: count() })
    .from(books)
    .where(eq(books.authorId, id));
  if (n > 0) throw conflict(`This author still has ${n} book(s) in the catalog`, "IN_USE");
  const [deleted] = await db
    .delete(authors)
    .where(eq(authors.id, id))
    .returning({ id: authors.id });
  if (!deleted) throw notFound("Author");
  res.status(204).end();
});

adminRouter.post("/genres", async (req, res) => {
  const { name } = parse(genreInputSchema, req);
  const [genre] = await db
    .insert(genres)
    .values({ name, slug: slugify(name) })
    .returning();
  res.status(201).json({ genre });
});

adminRouter.delete("/genres/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const [deleted] = await db.delete(genres).where(eq(genres.id, id)).returning({ id: genres.id });
  if (!deleted) throw notFound("Genre");
  res.status(204).end();
});

adminRouter.get("/orders", async (req, res) => {
  const { page, limit } = parse(pageQuery, req, "query");
  res.json(await listOrders({ page, limit }));
});

adminRouter.patch("/orders/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const { status } = parse(orderStatusInputSchema, req);
  res.json({ order: await updateOrderStatus(id, status) });
});
