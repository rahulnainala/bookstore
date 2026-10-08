import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { ORDER_STATUSES, ROLES } from "@bookstore/shared";

export const roleEnum = pgEnum("role", ROLES);
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("CUSTOMER"),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  ...timestamps,
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    isbn: text("isbn").notNull().unique(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    coverUrl: text("cover_url"),
    publishedDate: date("published_date", { mode: "string" }),
    pages: integer("pages"),
    featured: boolean("featured").notNull().default(false),
    // true for the starter catalog (demo admin can't delete these)
    seeded: boolean("seeded").notNull().default(false),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "restrict" }),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("books_author_idx").on(t.authorId),
    check("books_price_nonnegative", sql`${t.priceCents} >= 0`),
    check("books_stock_nonnegative", sql`${t.stock} >= 0`),
  ],
);

export const bookGenres = pgTable(
  "book_genres",
  {
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    genreId: integer("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.genreId] }),
    index("book_genres_genre_idx").on(t.genreId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    body: text("body").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    unique("reviews_user_book_unique").on(t.userId, t.bookId),
    index("reviews_book_idx").on(t.bookId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.bookId] }),
    check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    shipFullName: text("ship_full_name").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipLine2: text("ship_line2"),
    shipCity: text("ship_city").notNull(),
    shipPostalCode: text("ship_postal_code").notNull(),
    shipCountry: text("ship_country").notNull(),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // nullable so deleting a book doesn't delete order history
    bookId: integer("book_id").references(() => books.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_book_idx").on(t.bookId)],
);

export const booksRelations = relations(books, ({ one, many }) => ({
  author: one(authors, { fields: [books.authorId], references: [authors.id] }),
  bookGenres: many(bookGenres),
}));

export const bookGenresRelations = relations(bookGenres, ({ one }) => ({
  book: one(books, { fields: [bookGenres.bookId], references: [books.id] }),
  genre: one(genres, { fields: [bookGenres.genreId], references: [genres.id] }),
}));
