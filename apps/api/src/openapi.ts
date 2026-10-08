import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  authorInputSchema,
  bookInputSchema,
  bookQuerySchema,
  cartItemInputSchema,
  cartMergeSchema,
  checkoutSchema,
  demoLoginSchema,
  genreInputSchema,
  loginSchema,
  orderStatusInputSchema,
  registerSchema,
  reviewInputSchema,
} from "@bookstore/shared";

/**
 * OpenAPI document built from the same Zod schemas that validate requests, so the docs can't
 * drift from the implementation. Served as JSON at /api/openapi.json and as Swagger UI at /api/docs.
 */
const registry = new OpenAPIRegistry();
registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "bookstore_session",
});

const ok = (description: string) => ({ description });
const json = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });
const id = z.object({ id: z.coerce.number().int() });
const auth = [{ cookieAuth: [] }];

type Route = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  tag: string;
  summary: string;
  body?: z.ZodType;
  query?: z.ZodObject;
  params?: z.ZodObject;
  secured?: boolean;
};

// prettier-ignore
const routes: Route[] = [
  { method: "get", path: "/health", tag: "System", summary: "Liveness and database check" },

  { method: "post", path: "/v1/auth/register", tag: "Auth", summary: "Create an account and sign in", body: registerSchema },
  { method: "post", path: "/v1/auth/login", tag: "Auth", summary: "Sign in with email and password", body: loginSchema },
  { method: "post", path: "/v1/auth/demo", tag: "Auth", summary: "Sign in as the demo customer or demo admin", body: demoLoginSchema },
  { method: "post", path: "/v1/auth/logout", tag: "Auth", summary: "Clear the session cookie" },
  { method: "get", path: "/v1/auth/me", tag: "Auth", summary: "The signed-in user", secured: true },

  { method: "get", path: "/v1/books", tag: "Catalog", summary: "Search, filter, sort and paginate books", query: bookQuerySchema },
  { method: "get", path: "/v1/books/{slug}", tag: "Catalog", summary: "Book detail with related books", params: z.object({ slug: z.string() }) },
  { method: "get", path: "/v1/books/{id}/reviews", tag: "Reviews", summary: "Reviews for a book", params: id },
  { method: "put", path: "/v1/books/{id}/reviews", tag: "Reviews", summary: "Create or update your review", params: id, body: reviewInputSchema, secured: true },
  { method: "delete", path: "/v1/books/{id}/reviews", tag: "Reviews", summary: "Delete your review", params: id, secured: true },
  { method: "get", path: "/v1/authors", tag: "Catalog", summary: "All authors with book counts" },
  { method: "get", path: "/v1/authors/{id}", tag: "Catalog", summary: "Author with their books", params: id },
  { method: "get", path: "/v1/genres", tag: "Catalog", summary: "All genres with book counts" },

  { method: "get", path: "/v1/cart", tag: "Cart", summary: "Your cart", secured: true },
  { method: "put", path: "/v1/cart/items/{bookId}", tag: "Cart", summary: "Set quantity for a book", params: z.object({ bookId: z.coerce.number().int() }), body: cartItemInputSchema, secured: true },
  { method: "delete", path: "/v1/cart/items/{bookId}", tag: "Cart", summary: "Remove a book from the cart", params: z.object({ bookId: z.coerce.number().int() }), secured: true },
  { method: "post", path: "/v1/cart/merge", tag: "Cart", summary: "Merge a guest cart after sign-in", body: cartMergeSchema, secured: true },

  { method: "post", path: "/v1/orders", tag: "Orders", summary: "Check out the cart (transactional, simulated payment)", body: checkoutSchema, secured: true },
  { method: "get", path: "/v1/orders", tag: "Orders", summary: "Your order history", secured: true },
  { method: "get", path: "/v1/orders/{id}", tag: "Orders", summary: "One of your orders", params: id, secured: true },

  { method: "get", path: "/v1/admin/stats", tag: "Admin", summary: "Dashboard metrics", secured: true },
  { method: "post", path: "/v1/admin/books", tag: "Admin", summary: "Create a book", body: bookInputSchema, secured: true },
  { method: "put", path: "/v1/admin/books/{id}", tag: "Admin", summary: "Update a book", params: id, body: bookInputSchema, secured: true },
  { method: "delete", path: "/v1/admin/books/{id}", tag: "Admin", summary: "Delete a book", params: id, secured: true },
  { method: "post", path: "/v1/admin/authors", tag: "Admin", summary: "Create an author", body: authorInputSchema, secured: true },
  { method: "put", path: "/v1/admin/authors/{id}", tag: "Admin", summary: "Update an author", params: id, body: authorInputSchema, secured: true },
  { method: "delete", path: "/v1/admin/authors/{id}", tag: "Admin", summary: "Delete an author with no books", params: id, secured: true },
  { method: "post", path: "/v1/admin/genres", tag: "Admin", summary: "Create a genre", body: genreInputSchema, secured: true },
  { method: "delete", path: "/v1/admin/genres/{id}", tag: "Admin", summary: "Delete a genre", params: id, secured: true },
  { method: "get", path: "/v1/admin/orders", tag: "Admin", summary: "All orders", secured: true },
  { method: "patch", path: "/v1/admin/orders/{id}", tag: "Admin", summary: "Change order status (cancel restocks)", params: id, body: orderStatusInputSchema, secured: true },
];

for (const r of routes) {
  registry.registerPath({
    method: r.method,
    path: r.path,
    tags: [r.tag],
    summary: r.summary,
    security: r.secured ? auth : undefined,
    request: {
      body: r.body ? json(r.body) : undefined,
      query: r.query,
      params: r.params,
    },
    responses: {
      200: ok("Success"),
      400: ok("Validation error"),
      ...(r.secured ? { 401: ok("Not signed in"), 403: ok("Not allowed") } : {}),
    },
  });
}

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Bookstore API",
      version: "1.0.0",
      description:
        "REST API behind the Bookstore demo. Errors use the shape `{ error: { code, message, details } }`.",
    },
    servers: [{ url: "/api" }],
  });
}
