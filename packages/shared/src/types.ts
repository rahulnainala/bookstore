import type { OrderStatus, Role } from "./schemas";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isDemo: boolean;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  bookCount?: number;
}

export interface AuthorSummary {
  id: number;
  name: string;
}

export interface Author extends AuthorSummary {
  bio: string;
  bookCount?: number;
}

export interface BookSummary {
  id: number;
  slug: string;
  title: string;
  isbn: string;
  priceCents: number;
  stock: number;
  coverUrl: string | null;
  featured: boolean;
  author: AuthorSummary;
  genres: Pick<Genre, "id" | "name" | "slug">[];
  avgRating: number | null;
  reviewCount: number;
}

export interface BookDetail extends BookSummary {
  description: string;
  pages: number | null;
  publishedDate: string | null;
}

export interface Review {
  id: number;
  rating: number;
  body: string;
  createdAt: string;
  user: { id: number; name: string };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  bookId: number;
  quantity: number;
  book: BookSummary;
}

export interface Cart {
  items: CartItem[];
  subtotalCents: number;
}

export interface OrderItem {
  bookId: number;
  title: string;
  quantity: number;
  unitPriceCents: number;
  coverUrl: string | null;
  slug: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  shipping: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  customer?: { id: number; name: string; email: string };
}

export interface AdminStats {
  revenueCents: number;
  orderCount: number;
  customerCount: number;
  bookCount: number;
  salesByDay: { date: string; revenueCents: number; orders: number }[];
  topSellers: { bookId: number; title: string; unitsSold: number; revenueCents: number }[];
  lowStock: { bookId: number; title: string; stock: number }[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
