import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../../api/client";
import { useAuthors, useGenres } from "../../api/hooks";
import { Skeleton, Spinner } from "../../components/ui";
import { useTitle } from "../../lib/useTitle";

function useAdminMutation<T>(fn: (arg: T) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success);
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong"),
  });
}

export default function AdminAuthors() {
  useTitle("Authors & genres");
  const authors = useAuthors();
  const genres = useGenres();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [genreName, setGenreName] = useState("");

  const addAuthor = useAdminMutation(
    (body: { name: string; bio: string }) => api(v1("/admin/authors"), { method: "POST", body }),
    "Author added",
  );
  const deleteAuthor = useAdminMutation(
    (id: number) => api(v1(`/admin/authors/${id}`), { method: "DELETE" }),
    "Author deleted",
  );
  const addGenre = useAdminMutation(
    (n: string) => api(v1("/admin/genres"), { method: "POST", body: { name: n } }),
    "Genre added",
  );
  const deleteGenre = useAdminMutation(
    (id: number) => api(v1(`/admin/genres/${id}`), { method: "DELETE" }),
    "Genre deleted",
  );

  function submitAuthor(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addAuthor.mutate({ name, bio }, { onSuccess: () => (setName(""), setBio("")) });
  }
  function submitGenre(e: FormEvent) {
    e.preventDefault();
    if (!genreName.trim()) return;
    addGenre.mutate(genreName, { onSuccess: () => setGenreName("") });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="card p-5">
        <h2 className="mb-4 font-sans text-lg font-semibold">Authors</h2>
        <form onSubmit={submitAuthor} className="mb-6 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <label htmlFor="author-name" className="sr-only">
            Author name
          </label>
          <input
            id="author-name"
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="author-bio" className="sr-only">
            Short bio
          </label>
          <input
            id="author-bio"
            className="input"
            placeholder="Short bio (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <button type="submit" className="btn-accent" disabled={addAuthor.isPending}>
            {addAuthor.isPending && <Spinner />} Add
          </button>
        </form>
        {authors.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <ul className="divide-y divide-stone-200 text-sm dark:divide-stone-800">
            {authors.data?.items.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <Link to={`/authors/${a.id}`} className="font-medium hover:underline">
                    {a.name}
                  </Link>
                  <span className="muted ml-2 text-xs">
                    {a.bookCount} book{a.bookCount === 1 ? "" : "s"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-ghost px-2 text-red-600 disabled:opacity-30 dark:text-red-400"
                  disabled={!!a.bookCount || deleteAuthor.isPending}
                  title={a.bookCount ? "Remove this author's books first" : undefined}
                  aria-label={`Delete ${a.name}`}
                  onClick={() => confirm(`Delete ${a.name}?`) && deleteAuthor.mutate(a.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card h-fit p-5">
        <h2 className="mb-4 font-sans text-lg font-semibold">Genres</h2>
        <form onSubmit={submitGenre} className="mb-4 flex gap-2">
          <label htmlFor="genre-name" className="sr-only">
            Genre name
          </label>
          <input
            id="genre-name"
            className="input"
            placeholder="New genre"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
          />
          <button type="submit" className="btn-accent" disabled={addGenre.isPending}>
            Add
          </button>
        </form>
        <ul className="space-y-1 text-sm">
          {genres.data?.items.map((g) => (
            <li key={g.id} className="flex items-center justify-between">
              <span>
                {g.name} <span className="muted text-xs">· {g.bookCount}</span>
              </span>
              <button
                type="button"
                className="btn-ghost px-2 text-red-600 dark:text-red-400"
                aria-label={`Delete genre ${g.name}`}
                onClick={() =>
                  confirm(`Delete the ${g.name} genre? Books keep their other genres.`) &&
                  deleteGenre.mutate(g.id)
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
