import { z } from "zod";

// ---------- Common ----------

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ---------- Auth ----------

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const demoLoginSchema = z.object({
  role: z.enum(["customer", "admin"]),
});
export type DemoLoginInput = z.infer<typeof demoLoginSchema>;

// ---------- Catalog ----------

export const BOOK_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
  "title",
] as const;
export type BookSort = (typeof BOOK_SORTS)[number];

export const bookQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  genre: z.string().trim().max(60).optional(),
  author: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(BOOK_SORTS).default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});
export type BookQuery = z.input<typeof bookQuerySchema>;

const isbn13 = z
  .string()
  .trim()
  .regex(/^97[89]\d{10}$/, "ISBN must be 13 digits starting with 978 or 979");

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  isbn: isbn13,
  description: z.string().trim().max(5000).default(""),
  priceCents: z.coerce.number().int().min(0).max(1_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
  coverUrl: z
    .url()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  publishedDate: z.iso.date("Use YYYY-MM-DD").optional(),
  pages: z.coerce.number().int().min(1).max(10_000).optional(),
  featured: z.boolean().default(false),
  authorId: z.coerce.number().int().positive("Pick an author"),
  genreIds: z.array(z.number().int().positive()).max(5).default([]),
});
export type BookInput = z.input<typeof bookInputSchema>;

export const authorInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  bio: z.string().trim().max(3000).default(""),
});
export type AuthorInput = z.input<typeof authorInputSchema>;

export const genreInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});
export type GenreInput = z.input<typeof genreInputSchema>;

// ---------- Reviews ----------

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(2000).default(""),
});
export type ReviewInput = z.input<typeof reviewInputSchema>;

// ---------- Cart & orders ----------

export const MAX_QTY_PER_ITEM = 10;

export const cartItemInputSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM),
});

export const cartMergeSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
      }),
    )
    .max(50),
});
export type CartMergeInput = z.infer<typeof cartMergeSchema>;

export const shippingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  line1: z.string().trim().min(3, "Address is required").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "City is required").max(100),
  postalCode: z.string().trim().min(3, "Postal code is required").max(20),
  country: z.string().trim().min(2, "Country is required").max(60),
});
export type ShippingInput = z.infer<typeof shippingSchema>;

export const checkoutSchema = z.object({ shipping: shippingSchema });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderStatusInputSchema = z.object({ status: z.enum(ORDER_STATUSES) });
