import { Link, useParams } from "react-router";
import { ApiError } from "../api/client";
import { useAuthor } from "../api/hooks";
import { BookGrid } from "../components/BookCard";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useTitle } from "../lib/useTitle";

export default function Author() {
  const id = Number(useParams().id);
  const { data, isLoading, error, refetch } = useAuthor(id);
  useTitle(data?.author.name);

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState
        title="Author not found"
        action={
          <Link to="/books" className="btn-primary">
            Browse books
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );
  }

  return (
    <>
      <header className="mb-10 max-w-2xl">
        <p className="muted text-sm font-semibold tracking-wider uppercase">Author</p>
        {isLoading || !data ? (
          <Skeleton className="mt-2 h-10 w-64" />
        ) : (
          <>
            <h1 className="mt-1 text-4xl font-bold">{data.author.name}</h1>
            {data.author.bio && <p className="muted mt-3 text-lg">{data.author.bio}</p>}
          </>
        )}
      </header>
      <h2 className="mb-6 text-xl font-bold">Books{data && ` (${data.books.length})`}</h2>
      <BookGrid books={data?.books} loading={isLoading} skeletonCount={4} />
    </>
  );
}
