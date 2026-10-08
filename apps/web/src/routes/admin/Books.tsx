import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, type BookSummary } from "@bookstore/shared";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../../api/client";
import { useBooks } from "../../api/hooks";
import { BookCover } from "../../components/BookCover";
import { Pagination } from "../../components/Pagination";
import { Badge, ErrorState, Skeleton } from "../../components/ui";
import { useTitle } from "../../lib/useTitle";

export default function AdminBooks() {
  useTitle("Manage books");
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useBooks({
    q: q || undefined,
    sort: "title",
    page,
    limit: 20,
  });

  const remove = useMutation({
    mutationFn: (book: BookSummary) => api(v1(`/admin/books/${book.id}`), { method: "DELETE" }),
    onSuccess: (_d, book) => {
      toast.success(`Deleted “${book.title}”`);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Delete failed"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="admin-book-search" className="sr-only">
          Filter books
        </label>
        <input
          id="admin-book-search"
          type="search"
          className="input max-w-xs"
          placeholder="Filter by title, author or ISBN"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Link to="/admin/books/new" className="btn-accent">
          <Plus className="size-4" aria-hidden /> New book
        </Link>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="muted border-b border-stone-200 text-left text-xs uppercase dark:border-stone-800">
              <tr>
                <th className="p-3 font-medium">Book</th>
                <th className="p-3 text-right font-medium">Price</th>
                <th className="p-3 text-right font-medium">Stock</th>
                <th className="p-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !data
                ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="p-3">
                        <Skeleton className="h-10" />
                      </td>
                    </tr>
                  ))
                : data.items.map((b) => (
                    <tr key={b.id} className="border-t border-stone-200 dark:border-stone-800">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 shrink-0">
                            <BookCover src={b.coverUrl} title={b.title} author={b.author.name} />
                          </div>
                          <div>
                            <Link to={`/books/${b.slug}`} className="font-medium hover:underline">
                              {b.title}
                            </Link>
                            <p className="muted text-xs">{b.author.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">{formatPrice(b.priceCents)}</td>
                      <td className="p-3 text-right">
                        {b.stock <= 5 ? (
                          <Badge tone={b.stock === 0 ? "red" : "amber"}>{b.stock}</Badge>
                        ) : (
                          <span className="tabular-nums">{b.stock}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/books/${b.id}`}
                            className="btn-ghost px-2"
                            aria-label={`Edit ${b.title}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            className="btn-ghost px-2 text-red-600 dark:text-red-400"
                            aria-label={`Delete ${b.title}`}
                            disabled={remove.isPending}
                            onClick={() => {
                              if (confirm(`Delete “${b.title}”? This can't be undone.`))
                                remove.mutate(b);
                            }}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
