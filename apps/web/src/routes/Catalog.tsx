import clsx from "clsx";
import { BOOK_SORTS, type BookSort } from "@bookstore/shared";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { useBooks, useGenres } from "../api/hooks";
import { BookGrid } from "../components/BookCard";
import { Pagination } from "../components/Pagination";
import { EmptyState, ErrorState } from "../components/ui";
import { useTitle } from "../lib/useTitle";

const SORT_LABELS: Record<BookSort, string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Top rated",
  title: "Title A–Z",
};

const PRICE_RANGES = [
  { id: "under-10", label: "Under $10", min: undefined, max: 999 },
  { id: "10-15", label: "$10 – $15", min: 1000, max: 1499 },
  { id: "15-20", label: "$15 – $20", min: 1500, max: 1999 },
  { id: "20-plus", label: "$20 and up", min: 2000, max: undefined },
] as const;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? undefined;
  const genre = params.get("genre") ?? undefined;
  const price = PRICE_RANGES.find((p) => p.id === params.get("price"));
  const inStock = params.get("inStock") === "true";
  const sortParam = params.get("sort") as BookSort | null;
  const sort: BookSort = sortParam && BOOK_SORTS.includes(sortParam) ? sortParam : "featured";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const genres = useGenres();
  const genreName = genres.data?.items.find((g) => g.slug === genre)?.name;
  useTitle(q ? `Results for “${q}”` : (genreName ?? "Browse books"));

  const { data, isLoading, isFetching, error, refetch } = useBooks({
    q,
    genre,
    minPrice: price?.min,
    maxPrice: price?.max,
    inStock: inStock ? "true" : undefined,
    sort,
    page,
    limit: 24,
  });

  // read window.location, not `params` - params can be stale if two updates happen quickly
  function update(changes: Record<string, string | undefined>) {
    setParams(() => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(changes)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      return next;
    });
  }

  const activeFilters = [
    q && { key: "q", label: `“${q}”` },
    genre && { key: "genre", label: genreName ?? genre },
    price && { key: "price", label: price.label },
    inStock && { key: "inStock", label: "In stock" },
  ].filter(Boolean) as { key: string; label: string }[];

  const filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Genre</legend>
        <div className="space-y-1">
          {[
            { slug: undefined, name: "All genres", bookCount: undefined },
            ...(genres.data?.items ?? []),
          ].map((g) => (
            <button
              key={g.slug ?? "all"}
              type="button"
              aria-pressed={genre === g.slug}
              onClick={() => update({ genre: g.slug })}
              className={clsx(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                genre === g.slug
                  ? "bg-amber-100 font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-300"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800",
              )}
            >
              {g.name}
              {g.bookCount !== undefined && <span className="muted text-xs">{g.bookCount}</span>}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Price</legend>
        <div className="space-y-2">
          {PRICE_RANGES.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="price"
                className="accent-amber-600"
                checked={price?.id === p.id}
                onChange={() => update({ price: p.id })}
              />
              {p.label}
            </label>
          ))}
          {price && (
            <button
              type="button"
              className="text-xs text-amber-700 hover:underline dark:text-amber-400"
              onClick={() => update({ price: undefined })}
            >
              Any price
            </button>
          )}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-amber-600"
          checked={inStock}
          onChange={(e) => update({ inStock: e.target.checked ? "true" : undefined })}
        />
        In stock only
      </label>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        {filters}
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {q ? `Results for “${q}”` : (genreName ?? "All books")}
            </h1>
            <p className="muted mt-1 text-sm" aria-live="polite">
              {data ? `${data.total} book${data.total === 1 ? "" : "s"}` : " "}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <details className="relative lg:hidden">
              <summary className="btn-secondary cursor-pointer list-none">
                <SlidersHorizontal className="size-4" aria-hidden /> Filters
              </summary>
              <div className="card absolute right-0 z-20 mt-2 w-64 p-4 shadow-lg">{filters}</div>
            </details>
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              className="input w-auto"
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              {BOOK_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => update({ [f.key]: undefined })}
                className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-3 py-1 text-xs font-medium hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
                aria-label={`Remove filter ${f.label}`}
              >
                {f.label} <X className="size-3" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              className="text-xs text-amber-700 hover:underline dark:text-amber-400"
              onClick={() => setParams({})}
            >
              Clear all
            </button>
          </div>
        )}

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-10" />}
            title="No books match"
            action={
              <button type="button" className="btn-secondary" onClick={() => setParams({})}>
                Clear filters
              </button>
            }
          >
            Try a different search term or remove a filter.
          </EmptyState>
        ) : (
          <div className={clsx("transition-opacity", isFetching && !isLoading && "opacity-60")}>
            <BookGrid books={data?.items} loading={isLoading} skeletonCount={12} />
          </div>
        )}

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(p) => {
              update({ page: String(p) });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>
    </div>
  );
}
