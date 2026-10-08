import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MAX_QTY_PER_ITEM, type BookSummary, type Cart, type CartItem } from "@bookstore/shared";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../api/client";
import { keys } from "../api/hooks";
import { useAuth } from "./auth";
import {
  addToGuestCart,
  readGuestCart,
  setGuestQty,
  subtotalOf,
  writeGuestCart,
} from "./guest-cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  isLoading: boolean;
  quantityOf: (bookId: number) => number;
  add: (book: BookSummary, quantity?: number) => Promise<void>;
  setQuantity: (book: BookSummary, quantity: number) => Promise<void>;
  remove: (book: BookSummary) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// Guests get a localStorage cart, logged in users get the server one.
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestItems, setGuestItems] = useState<CartItem[]>(readGuestCart);

  useEffect(() => writeGuestCart(guestItems), [guestItems]);

  const serverCart = useQuery({
    queryKey: keys.cart,
    queryFn: () => api<Cart>(v1("/cart")),
    enabled: !!user,
  });

  // merge the guest cart on login. report loading until it's done, otherwise checkout sees an
  // empty cart for a moment and redirects
  const [mergeFailedFor, setMergeFailedFor] = useState<number | null>(null);
  const merging = useRef(false);
  const mergePending = !!user && guestItems.length > 0 && mergeFailedFor !== user.id;

  useEffect(() => {
    if (!user || !mergePending || merging.current) return;
    merging.current = true;
    api<Cart>(v1("/cart/merge"), {
      method: "POST",
      body: { items: guestItems.map((i) => ({ bookId: i.bookId, quantity: i.quantity })) },
    })
      .then((cart) => {
        queryClient.setQueryData(keys.cart, cart);
        setGuestItems([]);
      })
      .catch(() => {
        toast.error("We couldn't move your saved cart to your account");
        setMergeFailedFor(user.id);
      })
      .finally(() => {
        merging.current = false;
      });
  }, [user, mergePending, guestItems, queryClient]);

  const mutation = useMutation({
    mutationFn: ({ bookId, quantity }: { bookId: number; quantity: number }) =>
      quantity > 0
        ? api<Cart>(v1(`/cart/items/${bookId}`), { method: "PUT", body: { quantity } })
        : api<Cart>(v1(`/cart/items/${bookId}`), { method: "DELETE" }),
    onSuccess: (cart) => queryClient.setQueryData(keys.cart, cart),
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't update your cart"),
  });

  const value = useMemo<CartContextValue>(() => {
    const items = user ? (serverCart.data?.items ?? []) : guestItems;
    const quantityOf = (bookId: number) => items.find((i) => i.bookId === bookId)?.quantity ?? 0;

    const setQuantity = async (book: BookSummary, quantity: number) => {
      if (user) {
        await mutation.mutateAsync({
          bookId: book.id,
          quantity: Math.min(quantity, MAX_QTY_PER_ITEM),
        });
      } else {
        setGuestItems((prev) => setGuestQty(prev, book, quantity));
      }
    };

    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: user ? (serverCart.data?.subtotalCents ?? 0) : subtotalOf(guestItems),
      isLoading: !!user && (serverCart.isPending || mergePending),
      quantityOf,
      setQuantity,
      add: async (book, quantity = 1) => {
        if (user) await setQuantity(book, quantityOf(book.id) + quantity);
        else setGuestItems((prev) => addToGuestCart(prev, book, quantity));
      },
      remove: (book) => setQuantity(book, 0),
    };
  }, [user, serverCart.data, serverCart.isPending, mergePending, guestItems, mutation]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
