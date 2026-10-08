import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ApiError } from "./api/client";
import { RequireAuth } from "./components/guards";
import { Layout } from "./components/Layout";
import "./index.css";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import Account from "./routes/Account";
import { Login, Register } from "./routes/Auth";
import Author from "./routes/Author";
import BookDetail from "./routes/BookDetail";
import CartPage from "./routes/Cart";
import Catalog from "./routes/Catalog";
import Checkout from "./routes/Checkout";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";
import OrderPage from "./routes/Order";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // no point retrying 4xx
      retry: (count, err) =>
        !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

const lazyDefault = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "books", element: <Catalog /> },
      { path: "books/:slug", element: <BookDetail /> },
      { path: "authors/:id", element: <Author /> },
      { path: "cart", element: <CartPage /> },
      {
        path: "checkout",
        element: (
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <RequireAuth>
            <OrderPage />
          </RequireAuth>
        ),
      },
      {
        path: "account",
        element: (
          <RequireAuth>
            <Account />
          </RequireAuth>
        ),
      },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      {
        path: "admin",
        lazy: lazyDefault(() => import("./routes/admin/AdminLayout")),
        children: [
          { index: true, lazy: lazyDefault(() => import("./routes/admin/Dashboard")) },
          { path: "books", lazy: lazyDefault(() => import("./routes/admin/Books")) },
          { path: "books/new", lazy: lazyDefault(() => import("./routes/admin/BookForm")) },
          { path: "books/:id", lazy: lazyDefault(() => import("./routes/admin/BookForm")) },
          { path: "authors", lazy: lazyDefault(() => import("./routes/admin/Authors")) },
          { path: "orders", lazy: lazyDefault(() => import("./routes/admin/Orders")) },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
