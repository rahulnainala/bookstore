import { Router } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  bookQuerySchema,
  idParam,
  reviewInputSchema,
  type Author,
  type Genre,
  type Review,
} from "@bookstore/shared";
import { db } from "../db/client";
import { authors, bookGenres, books, genres, reviews, users } from "../db/schema";
import { currentUser, requireAuth } from "../lib/auth";
import { notFound } from "../lib/errors";
import { parse } from "../lib/validate";
import { getBookBySlug, listBooks, relatedBooks } from "../services/books";

export const catalogRouter = Router();

catalogRouter.get("/books", async (req, res) => {
  res.json(await listBooks(parse(bookQuerySchema, req, "query")));
});

catalogRouter.get("/books/:slug", async (req, res) => {
  const { slug } = parse(z.object({ slug: z.string().max(120) }), req, "params");
  const book = await getBookBySlug(slug);
  res.json({ book, related: await relatedBooks(book.id) });
});

catalogRouter.get("/authors", async (_req, res) => {
  const rows: Author[] = await db
    .select({
      id: authors.id,
      name: authors.name,
      bio: authors.bio,
      bookCount: sql<number>`count(${books.id})::int`,
    })
    .from(authors)
    .leftJoin(books, eq(books.authorId, authors.id))
    .groupBy(authors.id)
    .orderBy(asc(authors.name));
  res.json({ items: rows });
});

catalogRouter.get("/authors/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const author = await db.query.authors.findFirst({
    where: eq(authors.id, id),
    columns: { id: true, name: true, bio: true },
  });
  if (!author) throw notFound("Author");
  const bookList = await listBooks({ author: id, sort: "newest", page: 1, limit: 48 });
  res.json({ author, books: bookList.items });
});

catalogRouter.get("/genres", async (_req, res) => {
  const rows: Genre[] = await db
    .select({
      id: genres.id,
      name: genres.name,
      slug: genres.slug,
      bookCount: sql<number>`count(${bookGenres.bookId})::int`,
    })
    .from(genres)
    .leftJoin(bookGenres, eq(bookGenres.genreId, genres.id))
    .groupBy(genres.id)
    .orderBy(asc(genres.name));
  res.json({ items: rows });
});

catalogRouter.get("/books/:id/reviews", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      userId: users.id,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.bookId, id))
    .orderBy(desc(reviews.createdAt), desc(reviews.id));
  const items: Review[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    user: { id: r.userId, name: r.userName },
  }));
  res.json({ items });
});

// one review per user per book, posting again replaces it
catalogRouter.put("/books/:id/reviews", requireAuth, async (req, res) => {
  const { id } = parse(idParam, req, "params");
  const input = parse(reviewInputSchema, req);
  const user = currentUser(req);
  const book = await db.query.books.findFirst({ where: eq(books.id, id), columns: { id: true } });
  if (!book) throw notFound("Book");
  const [review] = await db
    .insert(reviews)
    .values({ userId: user.id, bookId: id, rating: input.rating, body: input.body })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.bookId],
      set: { rating: input.rating, body: input.body, createdAt: new Date() },
    })
    .returning();
  res.json({
    review: {
      id: review!.id,
      rating: review!.rating,
      body: review!.body,
      createdAt: review!.createdAt.toISOString(),
      user: { id: user.id, name: user.name },
    } satisfies Review,
  });
});

catalogRouter.delete("/books/:id/reviews", requireAuth, async (req, res) => {
  const { id } = parse(idParam, req, "params");
  await db
    .delete(reviews)
    .where(and(eq(reviews.bookId, id), eq(reviews.userId, currentUser(req).id)));
  res.status(204).end();
});
