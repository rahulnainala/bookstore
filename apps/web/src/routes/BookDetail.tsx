import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, MAX_QTY_PER_ITEM, type BookDetail as Book } from "@bookstore/shared";
import { Check, ShoppingBag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../api/client";
import { keys, useBook, useReviews } from "../api/hooks";
import { BookCover } from "../components/BookCover";
import { BookGrid } from "../components/BookCard";
import { QuantityStepper } from "../components/QuantityStepper";
import { StarInput, Stars } from "../components/Stars";
import { Badge, EmptyState, ErrorState, Skeleton, Spinner } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useTitle } from "../lib/useTitle";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge tone="red">Out of stock</Badge>;
  if (stock <= 5) return <Badge tone="amber">Only {stock} left</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

function BuyBox({ book }: { book: Book }) {
  const cart = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const inCart = cart.quantityOf(book.id);
  const max = Math.max(1, Math.min(MAX_QTY_PER_ITEM, book.stock) - inCart);
  const soldOut = book.stock === 0;
  const atLimit = inCart >= Math.min(MAX_QTY_PER_ITEM, book.stock);

  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-semibold">{formatPrice(book.priceCents)}</span>
        <StockBadge stock={book.stock} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={Math.min(qty, max)}
          max={max}
          onChange={setQty}
          label="Quantity"
          disabled={soldOut || atLimit}
        />
        <button
          type="button"
          className="btn-accent flex-1 py-2.5"
          disabled={soldOut || atLimit}
          onClick={async () => {
            await cart.add(book, Math.min(qty, max));
            setQty(1);
            toast.success(`Added “${book.title}” to your cart`, {
              action: { label: "View cart", onClick: () => navigate("/cart") },
            });
          }}
        >
          <ShoppingBag className="size-4" aria-hidden />
          {soldOut ? "Sold out" : atLimit ? "Max in cart" : "Add to cart"}
        </button>
      </div>
      {inCart > 0 && (
        <p className="mt-3 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" aria-hidden /> {inCart} in your{" "}
          <Link to="/cart" className="underline">
            cart
          </Link>
        </p>
      )}
    </div>
  );
}

function ReviewForm({ book }: { book: Book }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api(v1(`/books/${book.id}/reviews`), { method: "PUT", body: { rating, body } }),
    onSuccess: () => {
      toast.success("Thanks for your review!");
      setRating(0);
      setBody("");
      queryClient.invalidateQueries({ queryKey: keys.reviews(book.id) });
      queryClient.invalidateQueries({ queryKey: keys.book(book.slug) });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your review"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) return toast.error("Pick a star rating first");
    mutation.mutate();
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-sans font-semibold">Write a review</h3>
      <StarInput value={rating} onChange={setRating} />
      <label htmlFor="review-body" className="sr-only">
        Your review
      </label>
      <textarea
        id="review-body"
        className="input min-h-24"
        maxLength={2000}
        placeholder="What did you think? (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {mutation.isPending && <Spinner />} Post review
      </button>
      <p className="muted text-xs">
        One review per reader. Posting again replaces your previous review.
      </p>
    </form>
  );
}

function Reviews({ book }: { book: Book }) {
  const { user } = useAuth();
  const { data, isLoading } = useReviews(book.id);
  return (
    <section className="mt-16" aria-labelledby="reviews-heading">
      <div className="mb-6 flex flex-wrap items-baseline gap-4">
        <h2 id="reviews-heading" className="text-2xl font-bold">
          Reader reviews
        </h2>
        <Stars value={book.avgRating} count={book.reviewCount} size="md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : data?.items.length ? (
            data.items.map((r) => (
              <article key={r.id} className="border-b border-stone-200 pb-4 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium">{r.user.name}</span>
                  <time className="muted text-xs" dateTime={r.createdAt}>
                    {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </time>
                </div>
                {r.body && <p className="mt-2 text-sm">{r.body}</p>}
              </article>
            ))
          ) : (
            <p className="muted text-sm">No reviews yet. Be the first!</p>
          )}
        </div>
        <div>
          {user ? (
            <ReviewForm book={book} />
          ) : (
            <div className="card p-5 text-sm">
              <Link
                to={`/login?next=/books/${book.slug}`}
                className="font-medium text-amber-700 underline dark:text-amber-400"
              >
                Sign in
              </Link>{" "}
              to write a review.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function BookDetail() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useBook(slug);
  useTitle(data?.book.title);

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          title="Book not found"
          action={
            <Link to="/books" className="btn-primary">
              Browse books
            </Link>
          }
        >
          It may have been removed from the catalog.
        </EmptyState>
      );
    }
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-10 md:grid-cols-[18rem_1fr]">
        <Skeleton className="aspect-[2/3] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const { book, related } = data;
  const details = [
    ["ISBN", book.isbn],
    ["Pages", book.pages],
    ["Published", book.publishedDate && new Date(book.publishedDate).getUTCFullYear()],
  ].filter(([, v]) => v) as [string, string | number][];

  return (
    <>
      <nav aria-label="Breadcrumb" className="muted mb-6 text-sm">
        <Link to="/books" className="hover:underline">
          Books
        </Link>
        {book.genres[0] && (
          <>
            {" / "}
            <Link to={`/books?genre=${book.genres[0].slug}`} className="hover:underline">
              {book.genres[0].name}
            </Link>
          </>
        )}
      </nav>
      <div className="grid gap-10 md:grid-cols-[18rem_1fr]">
        <div className="mx-auto w-56 md:w-full">
          <BookCover
            src={book.coverUrl}
            title={book.title}
            author={book.author.name}
            eager
            className="shadow-xl"
          />
        </div>
        <div>
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{book.title}</h1>
          <p className="mt-2 text-lg">
            by{" "}
            <Link
              to={`/authors/${book.author.id}`}
              className="font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              {book.author.name}
            </Link>
          </p>
          <div className="mt-3">
            <Stars value={book.avgRating} count={book.reviewCount} size="md" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {book.genres.map((g) => (
              <Link key={g.id} to={`/books?genre=${g.slug}`}>
                <Badge>{g.name}</Badge>
              </Link>
            ))}
          </div>
          <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
            <div>
              <p className="mt-6 leading-relaxed">{book.description}</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <BuyBox book={book} />
          </div>
        </div>
      </div>

      <Reviews book={book} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
          <BookGrid books={related} />
        </section>
      )}
    </>
  );
}
