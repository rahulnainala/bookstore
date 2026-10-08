import { formatPrice } from "@bookstore/shared";
import { Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useOrders } from "../api/hooks";
import { Pagination } from "../components/Pagination";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useTitle";
import { OrderStatusBadge } from "./OrderStatus";

export default function Account() {
  useTitle("Your account");
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOrders(page);

  return (
    <>
      <PageHeader title="Your account" />
      <div className="card mb-8 p-5">
        <p className="font-medium">{user?.name}</p>
        <p className="muted text-sm">{user?.email}</p>
      </div>
      <h2 className="mb-4 text-2xl font-bold">Order history</h2>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton className="h-48" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title="No orders yet"
          action={
            <Link to="/books" className="btn-primary">
              Find a book
            </Link>
          }
        />
      ) : (
        <>
          <ul className="card divide-y divide-stone-200 dark:divide-stone-800">
            {data.items.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <span className="font-medium">Order #{o.id}</span>
                  <span className="muted text-sm">
                    {new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                  <span className="muted flex-1 truncate text-sm">
                    {o.items.map((i) => i.title).join(", ")}
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <span className="w-20 text-right font-semibold">{formatPrice(o.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
