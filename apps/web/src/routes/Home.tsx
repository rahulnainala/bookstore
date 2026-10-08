import { ArrowRight, Code2, Database, ShieldCheck, Truck } from "lucide-react";
import { formatPrice, FREE_SHIPPING_THRESHOLD_CENTS } from "@bookstore/shared";
import { Link } from "react-router";
import { useBooks, useGenres } from "../api/hooks";
import { BookCover } from "../components/BookCover";
import { BookGrid } from "../components/BookCard";
import { ErrorState, Skeleton } from "../components/ui";
import { LINKS } from "../lib/links";
import { useTitle } from "../lib/useTitle";

function Shelf({
  title,
  to,
  query,
}: {
  title: string;
  to: string;
  query: Parameters<typeof useBooks>[0];
}) {
  const { data, isLoading, error, refetch } = useBooks(query);
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link
          to={to}
          className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          See all <ArrowRight className="inline size-3.5" aria-hidden />
        </Link>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <BookGrid books={data?.items} loading={isLoading} skeletonCount={6} />
      )}
    </section>
  );
}

export default function Home() {
  useTitle();
  const genres = useGenres();
  const hero = useBooks({ sort: "featured", limit: 3 });

  return (
    <>
      <section className="grid items-center gap-10 py-6 md:grid-cols-2 md:py-12">
        <div>
          <p className="mb-3 text-sm font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
            Independent bookstore · Demo
          </p>
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            Find your next <em className="text-amber-700 dark:text-amber-400">favourite</em> book.
          </h1>
          <p className="muted mt-5 max-w-lg text-lg">
            Browse classics, new favourites and big ideas. Free shipping on orders over{" "}
            {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/books" className="btn-accent px-5 py-2.5 text-base">
              Browse the catalog
            </Link>
            <Link to="/login" className="btn-secondary px-5 py-2.5 text-base">
              Try a demo account
            </Link>
          </div>
        </div>
        <div
          className="relative mx-auto flex h-72 w-full max-w-md items-end justify-center sm:h-80"
          aria-hidden
        >
          {hero.isLoading || !hero.data
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 h-64 w-40" />)
            : hero.data.items.map((b, i) => (
                <div
                  key={b.id}
                  className={
                    i === 1
                      ? "z-10 w-44 sm:w-48"
                      : i === 0
                        ? "w-36 translate-x-6 -rotate-6 sm:w-40"
                        : "w-36 -translate-x-6 rotate-6 sm:w-40"
                  }
                >
                  <BookCover
                    src={b.coverUrl}
                    title={b.title}
                    author={b.author.name}
                    eager
                    className="shadow-xl"
                  />
                </div>
              ))}
        </div>
      </section>

      <section aria-label="Shop by genre" className="mt-8">
        <div className="flex flex-wrap gap-2">
          {genres.data?.items.map((g) => (
            <Link
              key={g.id}
              to={`/books?genre=${g.slug}`}
              className="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:border-amber-600 hover:text-amber-700 dark:border-stone-700 dark:hover:border-amber-400 dark:hover:text-amber-400"
            >
              {g.name} <span className="muted">· {g.bookCount}</span>
            </Link>
          ))}
        </div>
      </section>

      <Shelf title="Staff picks" to="/books?sort=featured" query={{ sort: "featured", limit: 6 }} />
      <Shelf title="Top rated" to="/books?sort=rating" query={{ sort: "rating", limit: 6 }} />
      <Shelf
        title="Recently published"
        to="/books?sort=newest"
        query={{ sort: "newest", limit: 6 }}
      />

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Truck,
            title: "Fast, tracked delivery",
            body: "Every order ships with tracking. Watch the status move from paid to delivered.",
          },
          {
            icon: ShieldCheck,
            title: "Secure checkout",
            body: "Stock is reserved in a single database transaction, so you'll never buy a book we don't have.",
          },
          {
            icon: Database,
            title: "Real reviews",
            body: "Ratings come from readers. Sign in to leave your own.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6">
            <Icon className="size-6 text-amber-600" aria-hidden />
            <h3 className="mt-3 font-sans font-semibold">{title}</h3>
            <p className="muted mt-1 text-sm">{body}</p>
          </div>
        ))}
      </section>

      <section className="card mt-6 flex flex-col gap-4 bg-stone-900 p-8 text-stone-100 sm:flex-row sm:items-center sm:justify-between dark:bg-stone-900">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Code2 className="size-6 text-amber-400" aria-hidden /> About this project
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-300">
            Folio is a full-stack portfolio project: React, TanStack Query and Tailwind on the
            front; Express, PostgreSQL and Drizzle ORM on the back, with shared Zod schemas,
            cookie-based auth, transactional checkout, integration tests and an OpenAPI spec.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <a href={LINKS.repo} className="btn bg-white text-stone-900 hover:bg-stone-200">
            View source
          </a>
          <a href={LINKS.apiDocs} className="btn border border-stone-600 hover:bg-stone-800">
            API docs
          </a>
        </div>
      </section>
    </>
  );
}
