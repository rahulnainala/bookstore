import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookInputSchema, type BookDetail } from "@bookstore/shared";
import { useEffect } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { api, ApiError, v1 } from "../../api/client";
import { useAdminBook, useAuthors, useGenres } from "../../api/hooks";
import { ErrorState, Field, Skeleton, Spinner } from "../../components/ui";
import { useTitle } from "../../lib/useTitle";

// The form edits the price in dollars; the API takes cents.
const formSchema = bookInputSchema.omit({ priceCents: true }).extend({
  price: z.coerce.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(10_000),
  pages: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(1).max(10_000).optional(),
  ),
  publishedDate: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.iso.date("Use YYYY-MM-DD").optional(),
  ),
});
type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

const empty: FormIn = {
  title: "",
  isbn: "",
  description: "",
  price: "",
  stock: 10,
  coverUrl: "",
  publishedDate: "",
  pages: "",
  featured: false,
  authorId: "",
  genreIds: [],
};

function toForm(b: BookDetail): FormIn {
  return {
    title: b.title,
    isbn: b.isbn,
    description: b.description,
    price: (b.priceCents / 100).toFixed(2),
    stock: b.stock,
    coverUrl: b.coverUrl ?? "",
    publishedDate: b.publishedDate ?? "",
    pages: b.pages ?? "",
    featured: b.featured,
    authorId: b.author.id,
    genreIds: b.genres.map((g) => g.id),
  };
}

export default function BookForm() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const isEdit = id !== undefined;
  useTitle(isEdit ? "Edit book" : "New book");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const existing = useAdminBook(id);
  const authors = useAuthors();
  const genres = useGenres();

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: empty,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (existing.data) form.reset(toForm(existing.data.book));
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: ({ price, ...rest }: FormOut) =>
      api<{ book: BookDetail }>(v1(isEdit ? `/admin/books/${id}` : "/admin/books"), {
        method: isEdit ? "PUT" : "POST",
        body: { ...rest, priceCents: Math.round(price * 100) },
      }),
    onSuccess: ({ book }) => {
      toast.success(isEdit ? "Book updated" : "Book created");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      navigate(isEdit ? "/admin/books" : `/books/${book.slug}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.details) {
        for (const [field, msgs] of Object.entries(err.details)) {
          form.setError((field === "priceCents" ? "price" : field) as Path<FormIn>, {
            message: msgs[0],
          });
        }
      }
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    },
  });

  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />;
  if (isEdit && existing.isLoading) return <Skeleton className="h-96" />;

  const reg = (name: Path<FormIn>) => ({
    id: name,
    className: "input",
    "aria-invalid": !!errors[name as keyof typeof errors],
    ...form.register(name),
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      className="card max-w-3xl space-y-5 p-6"
    >
      <h2 className="font-sans text-xl font-semibold">{isEdit ? "Edit book" : "Add a new book"}</h2>
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input {...reg("title")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Author" htmlFor="authorId" error={errors.authorId?.message}>
          <select {...reg("authorId")}>
            <option value="">Choose an author…</option>
            {authors.data?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="ISBN-13"
          htmlFor="isbn"
          error={errors.isbn?.message}
          hint="13 digits, no dashes"
        >
          <input {...reg("isbn")} inputMode="numeric" />
        </Field>
        <Field label="Price (USD)" htmlFor="price" error={errors.price?.message}>
          <input {...reg("price")} inputMode="decimal" placeholder="12.99" />
        </Field>
        <Field label="Stock" htmlFor="stock" error={errors.stock?.message}>
          <input {...reg("stock")} type="number" min={0} />
        </Field>
        <Field label="Published" htmlFor="publishedDate" error={errors.publishedDate?.message}>
          <input {...reg("publishedDate")} type="date" />
        </Field>
        <Field label="Pages" htmlFor="pages" error={errors.pages?.message}>
          <input {...reg("pages")} type="number" min={1} />
        </Field>
      </div>
      <Field
        label="Cover image URL"
        htmlFor="coverUrl"
        error={errors.coverUrl?.message}
        hint="Leave empty for a generated cover"
      >
        <input
          {...reg("coverUrl")}
          type="url"
          placeholder="https://covers.openlibrary.org/b/isbn/…-L.jpg"
        />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea {...reg("description")} rows={4} />
      </Field>
      <fieldset>
        <legend className="label">Genres</legend>
        <Controller
          control={form.control}
          name="genreIds"
          render={({ field }) => {
            const value = (field.value ?? []) as number[];
            return (
              <div className="flex flex-wrap gap-2">
                {genres.data?.items.map((g) => {
                  const checked = value.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${checked ? "border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200" : "border-stone-300 dark:border-stone-700"}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          field.onChange(
                            checked ? value.filter((v) => v !== g.id) : [...value, g.id],
                          )
                        }
                      />
                      {g.name}
                    </label>
                  );
                })}
              </div>
            );
          }}
        />
        {errors.genreIds && <p className="mt-1 text-xs text-red-600">{errors.genreIds.message}</p>}
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-amber-600" {...form.register("featured")} />{" "}
        Feature on the home page
      </label>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-accent" disabled={save.isPending}>
          {save.isPending && <Spinner />} {isEdit ? "Save changes" : "Create book"}
        </button>
        <Link to="/admin/books" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
