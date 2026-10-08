import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  slugify,
  type BookDetail,
  type BookSummary,
  type bookInputSchema,
  type bookQuerySchema,
  type Paginated,
} from "@bookstore/shared";
import type { z } from "zod";
import { db, type Tx } from "../db/client";
import { authors, bookGenres, books, genres, reviews } from "../db/schema";
import { notFound } from "../lib/errors";

type BookQuery = z.output<typeof bookQuerySchema>;
type BookInput = z.output<typeof bookInputSchema>;

const ratings = db
  .select({
    bookId: reviews.bookId,
    avgRating: sql<string>`avg(${reviews.rating})`.as("avg_rating"),
    reviewCount: sql<number>`count(*)::int`.as("review_count"),
  })
  .from(reviews)
  .groupBy(reviews.bookId)
  .as("ratings");

const summaryColumns = {
  id: books.id,
  slug: books.slug,
  title: books.title,
  isbn: books.isbn,
  priceCents: books.priceCents,
  stock: books.stock,
  coverUrl: books.coverUrl,
  featured: books.featured,
  authorId: authors.id,
  authorName: authors.name,
  avgRating: ratings.avgRating,
  reviewCount: ratings.reviewCount,
};

type SummaryRow = {
  id: number;
  slug: string;
  title: string;
  isbn: string;
  priceCents: number;
  stock: number;
  coverUrl: string | null;
  featured: boolean;
  authorId: number;
  authorName: string;
  avgRating: string | null;
  reviewCount: number | null;
};

function baseQuery() {
  return db
    .select(summaryColumns)
    .from(books)
    .innerJoin(authors, eq(books.authorId, authors.id))
    .leftJoin(ratings, eq(ratings.bookId, books.id));
}

async function genresFor(bookIds: number[]) {
  const map = new Map<number, BookSummary["genres"]>();
  if (bookIds.length === 0) return map;
  const rows = await db
    .select({ bookId: bookGenres.bookId, id: genres.id, name: genres.name, slug: genres.slug })
    .from(bookGenres)
    .innerJoin(genres, eq(bookGenres.genreId, genres.id))
    .where(inArray(bookGenres.bookId, bookIds))
    .orderBy(asc(genres.name));
  for (const { bookId, ...genre } of rows) {
    const list = map.get(bookId) ?? [];
    list.push(genre);
    map.set(bookId, list);
  }
  return map;
}

function toSummary(row: SummaryRow, genreMap: Map<number, BookSummary["genres"]>): BookSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    isbn: row.isbn,
    priceCents: row.priceCents,
    stock: row.stock,
    coverUrl: row.coverUrl,
    featured: row.featured,
    author: { id: row.authorId, name: row.authorName },
    genres: genreMap.get(row.id) ?? [],
    avgRating: row.avgRating === null ? null : Math.round(Number(row.avgRating) * 10) / 10,
    reviewCount: row.reviewCount ?? 0,
  };
}

async function hydrate(rows: SummaryRow[]): Promise<BookSummary[]> {
  const genreMap = await genresFor(rows.map((r) => r.id));
  return rows.map((r) => toSummary(r, genreMap));
}

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listBooks(query: BookQuery): Promise<Paginated<BookSummary>> {
  const filters: SQL[] = [];

  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    filters.push(
      or(
        ilike(books.title, term),
        ilike(authors.name, term),
        eq(books.isbn, query.q.replace(/-/g, "")),
      )!,
    );
  }
  if (query.genre) {
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(bookGenres)
          .innerJoin(genres, eq(bookGenres.genreId, genres.id))
          .where(and(eq(bookGenres.bookId, books.id), eq(genres.slug, query.genre))),
      ),
    );
  }
  if (query.author) filters.push(eq(books.authorId, query.author));
  if (query.minPrice !== undefined) filters.push(gte(books.priceCents, query.minPrice));
  if (query.maxPrice !== undefined) filters.push(lte(books.priceCents, query.maxPrice));
  if (query.inStock) filters.push(sql`${books.stock} > 0`);

  const where = filters.length ? and(...filters) : undefined;

  const orderBy = {
    featured: [desc(books.featured), sql`${ratings.reviewCount} desc nulls last`, asc(books.title)],
    newest: [sql`${books.publishedDate} desc nulls last`, asc(books.id)],
    price_asc: [asc(books.priceCents), asc(books.id)],
    price_desc: [desc(books.priceCents), asc(books.id)],
    rating: [
      sql`${ratings.avgRating} desc nulls last`,
      sql`${ratings.reviewCount} desc nulls last`,
      asc(books.id),
    ],
    title: [asc(books.title), asc(books.id)],
  }[query.sort];

  const [rows, [{ total } = { total: 0 }]] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(...orderBy)
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(books)
      .innerJoin(authors, eq(books.authorId, authors.id))
      .where(where),
  ]);

  return {
    items: await hydrate(rows),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getBook(where: SQL): Promise<BookDetail> {
  const [row] = await db
    .select({
      ...summaryColumns,
      description: books.description,
      pages: books.pages,
      publishedDate: books.publishedDate,
    })
    .from(books)
    .innerJoin(authors, eq(books.authorId, authors.id))
    .leftJoin(ratings, eq(ratings.bookId, books.id))
    .where(where)
    .limit(1);
  if (!row) throw notFound("Book");
  const [summary] = await hydrate([row]);
  return {
    ...summary!,
    description: row.description,
    pages: row.pages,
    publishedDate: row.publishedDate,
  };
}

export const getBookBySlug = (slug: string) => getBook(eq(books.slug, slug));
export const getBookById = (id: number) => getBook(eq(books.id, id));

export async function relatedBooks(bookId: number, limit = 6): Promise<BookSummary[]> {
  const rows = await baseQuery()
    .where(
      and(
        ne(books.id, bookId),
        exists(
          db
            .select({ one: sql`1` })
            .from(bookGenres)
            .where(
              and(
                eq(bookGenres.bookId, books.id),
                inArray(
                  bookGenres.genreId,
                  db
                    .select({ id: bookGenres.genreId })
                    .from(bookGenres)
                    .where(eq(bookGenres.bookId, bookId)),
                ),
              ),
            ),
        ),
      ),
    )
    .orderBy(sql`${ratings.avgRating} desc nulls last`, asc(books.id))
    .limit(limit);
  return hydrate(rows);
}

export async function summariesByIds(ids: number[]): Promise<Map<number, BookSummary>> {
  if (ids.length === 0) return new Map();
  const rows = await baseQuery().where(inArray(books.id, ids));
  const list = await hydrate(rows);
  return new Map(list.map((b) => [b.id, b]));
}

async function uniqueSlug(tx: Tx, title: string, excludeId?: number) {
  const base = slugify(title) || "book";
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await tx.query.books.findFirst({
      columns: { id: true },
      where: excludeId ? and(eq(books.slug, slug), ne(books.id, excludeId)) : eq(books.slug, slug),
    });
    if (!clash) return slug;
    slug = `${base}-${n}`;
  }
}

async function setGenres(tx: Tx, bookId: number, genreIds: number[]) {
  await tx.delete(bookGenres).where(eq(bookGenres.bookId, bookId));
  const unique = [...new Set(genreIds)];
  if (unique.length)
    await tx.insert(bookGenres).values(unique.map((genreId) => ({ bookId, genreId })));
}

export async function createBook(input: BookInput): Promise<BookDetail> {
  const id = await db.transaction(async (tx) => {
    const { genreIds, ...fields } = input;
    const [row] = await tx
      .insert(books)
      .values({
        ...fields,
        coverUrl: fields.coverUrl ?? null,
        slug: await uniqueSlug(tx, input.title),
      })
      .returning({ id: books.id });
    await setGenres(tx, row!.id, genreIds);
    return row!.id;
  });
  return getBookById(id);
}

export async function updateBook(id: number, input: BookInput): Promise<BookDetail> {
  await db.transaction(async (tx) => {
    const { genreIds, ...fields } = input;
    const [row] = await tx
      .update(books)
      .set({
        ...fields,
        coverUrl: fields.coverUrl ?? null,
        slug: await uniqueSlug(tx, input.title, id),
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning({ id: books.id });
    if (!row) throw notFound("Book");
    await setGenres(tx, id, genreIds);
  });
  return getBookById(id);
}
