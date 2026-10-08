import { formatPrice } from "@bookstore/shared";
import { CheckCircle2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { ApiError } from "../api/client";
import { useOrder } from "../api/hooks";
import { BookCover } from "../components/BookCover";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useTitle } from "../lib/useTitle";
import { OrderStatusBadge } from "./OrderStatus";

export default function OrderPage() {
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const justPlaced = params.get("placed") === "1";
  const { data, isLoading, error, refetch } = useOrder(id);
  useTitle(`Order #${id}`);

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyState
        title="Order not found"
        action={
          <Link to="/account" className="btn-primary">
            Your orders
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );
  }
  if (isLoading || !data) return <Skeleton className="h-96" />;

  const { order } = data;
  return (
    <div className="mx-auto max-w-3xl">
      {justPlaced && (
        <div className="mb-8 flex items-start gap-3 rounded-xl bg-emerald-50 p-5 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0" aria-hidden />
          <div>
            <h2 className="font-sans text-lg font-semibold">Thank you, your order is confirmed!</h2>
            <p className="text-sm">
              We've reserved your books. You can track this order from your account.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="muted mt-1 text-sm">
        Placed{" "}
        {new Date(order.createdAt).toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        })}
      </p>

      <ul className="card mt-6 divide-y divide-stone-200 dark:divide-stone-800">
        {order.items.map((item) => (
          <li key={`${item.bookId}-${item.title}`} className="flex items-center gap-4 p-4">
            <div className="w-12 shrink-0">
              <BookCover src={item.coverUrl} title={item.title} author="" />
            </div>
            <div className="flex-1">
              {item.slug ? (
                <Link to={`/books/${item.slug}`} className="font-medium hover:underline">
                  {item.title}
                </Link>
              ) : (
                <span className="font-medium">{item.title}</span>
              )}
              <p className="muted text-sm">
                {item.quantity} × {formatPrice(item.unitPriceCents)}
              </p>
            </div>
            <p className="font-semibold">{formatPrice(item.quantity * item.unitPriceCents)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="card p-5 text-sm">
          <h2 className="mb-2 font-sans font-semibold">Shipping to</h2>
          <address className="not-italic">
            {order.shipping.fullName}
            <br />
            {order.shipping.line1}
            {order.shipping.line2 && (
              <>
                <br />
                {order.shipping.line2}
              </>
            )}
            <br />
            {order.shipping.city} {order.shipping.postalCode}
            <br />
            {order.shipping.country}
          </address>
        </div>
        <dl className="card space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold dark:border-stone-800">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-8 flex gap-3">
        <Link to="/account" className="btn-secondary">
          All orders
        </Link>
        <Link to="/books" className="btn-primary">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
