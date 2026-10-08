import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, shippingSchema, type Order, type ShippingInput } from "@bookstore/shared";
import { CreditCard, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../api/client";
import { keys } from "../api/hooks";
import { Field, PageHeader, Skeleton, Spinner } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useTitle } from "../lib/useTitle";
import { OrderSummary } from "./Cart";

export default function Checkout() {
  useTitle("Checkout");
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      line1: "",
      line2: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });
  const { errors } = form.formState;

  const placeOrder = useMutation({
    mutationFn: (shipping: ShippingInput) =>
      api<{ order: Order }>(v1("/orders"), { method: "POST", body: { shipping } }),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(keys.order(order.id), { order });
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
      queryClient.setQueryData(keys.cart, { items: [], subtotalCents: 0 });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "OUT_OF_STOCK") {
        const msgs = Object.values(err.details ?? {}).flat();
        toast.error(err.message, { description: msgs.join(" · ") });
        queryClient.invalidateQueries({ queryKey: keys.cart });
      } else {
        toast.error(err instanceof ApiError ? err.message : "Checkout failed, please try again");
      }
    },
  });

  if (cart.isLoading) return <Skeleton className="h-96" />;
  if (cart.items.length === 0 && placeOrder.isIdle) return <Navigate to="/cart" replace />;

  const fill = () =>
    form.reset({
      fullName: user?.name ?? "Demo Customer",
      line1: "221B Baker Street",
      line2: "",
      city: "London",
      postalCode: "NW1 6XE",
      country: "United Kingdom",
    });

  const input = (name: keyof ShippingInput, autoComplete: string) => ({
    id: name,
    className: "input",
    autoComplete,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    ...form.register(name),
  });

  return (
    <>
      <PageHeader title="Checkout" />
      <form
        className="grid gap-8 lg:grid-cols-[1fr_22rem]"
        onSubmit={form.handleSubmit((values) => placeOrder.mutate(values))}
        noValidate
      >
        <div className="space-y-6">
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-semibold">Shipping address</h2>
              <button
                type="button"
                className="text-sm text-amber-700 hover:underline dark:text-amber-400"
                onClick={fill}
              >
                Fill sample address
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
                  <input {...input("fullName", "name")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" htmlFor="line1" error={errors.line1?.message}>
                  <input {...input("line1", "address-line1")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Apartment, suite, etc. (optional)"
                  htmlFor="line2"
                  error={errors.line2?.message}
                >
                  <input {...input("line2", "address-line2")} />
                </Field>
              </div>
              <Field label="City" htmlFor="city" error={errors.city?.message}>
                <input {...input("city", "address-level2")} />
              </Field>
              <Field label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message}>
                <input {...input("postalCode", "postal-code")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Country" htmlFor="country" error={errors.country?.message}>
                  <input {...input("country", "country-name")} />
                </Field>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold">
              <CreditCard className="size-5" aria-hidden /> Payment
            </h2>
            <div className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-200">
              <p className="font-medium">Test mode: no real payment is taken.</p>
              <p className="mt-1">
                This is a portfolio demo. Your order is recorded as paid straight away.
              </p>
            </div>
            <div className="mt-4 grid gap-3 opacity-60 sm:grid-cols-3" aria-hidden>
              <input
                className="input sm:col-span-3"
                value="4242 4242 4242 4242"
                readOnly
                tabIndex={-1}
              />
              <input className="input" value="12 / 34" readOnly tabIndex={-1} />
              <input className="input" value="123" readOnly tabIndex={-1} />
            </div>
          </section>
        </div>

        <OrderSummary subtotalCents={cart.subtotalCents}>
          <ul className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm dark:border-stone-800">
            {cart.items.map((i) => (
              <li key={i.bookId} className="flex justify-between gap-2">
                <span className="truncate">
                  {i.quantity} × {i.book.title}
                </span>
                <span className="shrink-0">{formatPrice(i.book.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            className="btn-accent mt-6 w-full py-2.5"
            disabled={placeOrder.isPending}
          >
            {placeOrder.isPending ? <Spinner /> : <Lock className="size-4" aria-hidden />}
            Place order
          </button>
          <Link to="/cart" className="btn-ghost mt-2 w-full">
            Back to cart
          </Link>
        </OrderSummary>
      </form>
    </>
  );
}
