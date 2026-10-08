import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  AdminStats,
  Author,
  BookDetail,
  BookQuery,
  BookSummary,
  Genre,
  Order,
  Paginated,
  Review,
} from "@bookstore/shared";
import { api, qs, v1 } from "./client";

export const keys = {
  books: (q: BookQuery) => ["books", q] as const,
  book: (slug: string) => ["book", slug] as const,
  reviews: (bookId: number) => ["reviews", bookId] as const,
  genres: ["genres"] as const,
  authors: ["authors"] as const,
  author: (id: number) => ["author", id] as const,
  me: ["me"] as const,
  cart: ["cart"] as const,
  orders: (page: number) => ["orders", page] as const,
  order: (id: number) => ["order", id] as const,
  adminStats: ["admin", "stats"] as const,
  adminOrders: (page: number) => ["admin", "orders", page] as const,
  adminBook: (id: number) => ["admin", "book", id] as const,
};

export function useBooks(query: BookQuery) {
  return useQuery({
    queryKey: keys.books(query),
    queryFn: () => api<Paginated<BookSummary>>(v1(`/books${qs({ ...query })}`)),
    placeholderData: keepPreviousData,
  });
}

export function useBook(slug: string) {
  return useQuery({
    queryKey: keys.book(slug),
    queryFn: () =>
      api<{ book: BookDetail; related: BookSummary[] }>(v1(`/books/${encodeURIComponent(slug)}`)),
  });
}

export function useReviews(bookId: number | undefined) {
  return useQuery({
    queryKey: keys.reviews(bookId ?? 0),
    queryFn: () => api<{ items: Review[] }>(v1(`/books/${bookId}/reviews`)),
    enabled: bookId !== undefined,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: keys.genres,
    queryFn: () => api<{ items: Genre[] }>(v1("/genres")),
    staleTime: 5 * 60_000,
  });
}

export function useAuthors() {
  return useQuery({
    queryKey: keys.authors,
    queryFn: () => api<{ items: Author[] }>(v1("/authors")),
    staleTime: 60_000,
  });
}

export function useAuthor(id: number) {
  return useQuery({
    queryKey: keys.author(id),
    queryFn: () => api<{ author: Author; books: BookSummary[] }>(v1(`/authors/${id}`)),
  });
}

export function useOrders(page: number) {
  return useQuery({
    queryKey: keys.orders(page),
    queryFn: () => api<Paginated<Order>>(v1(`/orders${qs({ page })}`)),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: keys.order(id),
    queryFn: () => api<{ order: Order }>(v1(`/orders/${id}`)),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: keys.adminStats,
    queryFn: () => api<AdminStats>(v1("/admin/stats")),
  });
}

export function useAdminOrders(page: number) {
  return useQuery({
    queryKey: keys.adminOrders(page),
    queryFn: () => api<Paginated<Order>>(v1(`/admin/orders${qs({ page, limit: 15 })}`)),
    placeholderData: keepPreviousData,
  });
}

export function useAdminBook(id: number | undefined) {
  return useQuery({
    queryKey: keys.adminBook(id ?? 0),
    queryFn: () => api<{ book: BookDetail }>(v1(`/admin/books/${id}`)),
    enabled: id !== undefined,
  });
}
