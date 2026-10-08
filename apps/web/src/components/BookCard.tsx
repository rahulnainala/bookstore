import { formatPrice, type BookSummary } from "@bookstore/shared";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useCart } from "../lib/cart";
import { BookCover } from "./BookCover";
import { Stars } from "./Stars";
import { Skeleton } from "./ui";

export function BookCard({ book, eager }: { book: BookSummary; eager?: boolean }) {
  const cart = useCart();
  const soldOut = book.stock === 0;
  return (
    <article className="group flex flex-col">
      <Link to={`/books/${book.slug}`} className="block rounded-md" aria-label={book.title}>
        <BookCover
          src={book.coverUrl}
          title={book.title}
          author={book.author.name}
          eager={eager}
          className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 font-sans text-sm leading-snug font-semibold">
          <Link to={`/books/${book.slug}`} className="hover:underline">
            {book.title}
          </Link>
        </h3>
        <p className="muted mt-0.5 text-xs">
          <Link to={`/authors/${book.author.id}`} className="hover:underline">
            {book.author.name}
          </Link>
        </p>
        <div className="mt-1">
          <Stars value={book.avgRating} count={book.reviewCount} />
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold">{formatPrice(book.priceCents)}</span>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            disabled={soldOut}
            aria-label={soldOut ? `${book.title} is sold out` : `Add ${book.title} to cart`}
            onClick={async () => {
              await cart.add(book);
              toast.success(`Added “${book.title}” to your cart`);
            }}
          >
            {soldOut ? "Sold out" : <ShoppingBag className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function BookGrid({
  books,
  loading,
  skeletonCount = 8,
}: {
  books?: BookSummary[];
  loading?: boolean;
  skeletonCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {loading || !books
        ? Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))
        : books.map((b, i) => <BookCard key={b.id} book={b} eager={i < 6} />)}
    </div>
  );
}
