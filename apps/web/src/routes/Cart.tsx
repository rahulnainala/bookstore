import {
  formatPrice,
  FREE_SHIPPING_THRESHOLD_CENTS,
  MAX_QTY_PER_ITEM,
  shippingFor,
} from "@bookstore/shared";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { BookCover } from "../components/BookCover";
import { QuantityStepper } from "../components/QuantityStepper";
import { EmptyState, PageHeader, Skeleton } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useTitle } from "../lib/useTitle";

export function OrderSummary({
  subtotalCents,
  children,
}: {
  subtotalCents: number;
  children?: React.ReactNode;
}) {
  const shipping = shippingFor(subtotalCents);
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;
  return (
    <div className="card h-fit p-6 lg:sticky lg:top-24">
      <h2 className="font-sans text-lg font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold dark:border-stone-800">
          <dt>Total</dt>
          <dd>{formatPrice(subtotalCents + shipping)}</dd>
        </div>
      </dl>
      {remaining > 0 && (
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          Add {formatPrice(remaining)} more for free shipping.
        </p>
      )}
      {children}
    </div>
  );
}

export default function CartPage() {
  useTitle("Your cart");
  const cart = useCart();
  const { user } = useAuth();

  if (cart.isLoading) return <Skeleton className="h-64" />;

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10" />}
        title="Your cart is empty"
        action={
          <Link to="/books" className="btn-primary">
            Start browsing
          </Link>
        }
      >
        Books you add will show up here.
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader title="Your cart" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="card divide-y divide-stone-200 dark:divide-stone-800">
          {cart.items.map(({ book, quantity }) => (
            <li key={book.id} className="flex gap-4 p-4">
              <Link to={`/books/${book.slug}`} className="w-20 shrink-0">
                <BookCover src={book.coverUrl} title={book.title} author={book.author.name} />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={`/books/${book.slug}`} className="font-medium hover:underline">
                      {book.title}
                    </Link>
                    <p className="muted text-sm">{book.author.name}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(book.priceCents * quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper
                    value={quantity}
                    max={Math.min(MAX_QTY_PER_ITEM, book.stock)}
                    onChange={(q) => cart.setQuantity(book, q)}
                    label={`Quantity of ${book.title}`}
                  />
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => cart.remove(book)}
                    aria-label={`Remove ${book.title}`}
                  >
                    <Trash2 className="size-4" aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <OrderSummary subtotalCents={cart.subtotalCents}>
          <Link to="/checkout" className="btn-accent mt-6 w-full py-2.5">
            {user ? "Checkout" : "Sign in to checkout"}
          </Link>
          <Link to="/books" className="btn-ghost mt-2 w-full">
            Continue shopping
          </Link>
        </OrderSummary>
      </div>
    </>
  );
}
