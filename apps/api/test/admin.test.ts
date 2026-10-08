import { describe, expect, it } from "vitest";
import { app, demo, makeBook, newCustomer, request, stockOf } from "./helpers";

const validBook = {
  title: "The Test-Driven Novel",
  isbn: "9781234567897",
  description: "A thriller about a failing build.",
  priceCents: 1999,
  stock: 7,
  publishedDate: "2024-01-15",
  pages: 250,
};

describe("admin access", () => {
  it("rejects anonymous users and customers", async () => {
    await request(app).get("/api/v1/admin/stats").expect(401);
    const customer = await newCustomer();
    const res = await customer.get("/api/v1/admin/stats").expect(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns dashboard stats for admins", async () => {
    const admin = await demo("admin");
    const res = await admin.get("/api/v1/admin/stats").expect(200);
    expect(res.body.salesByDay).toHaveLength(30);
    expect(res.body.revenueCents).toBeGreaterThan(0);
    expect(res.body.topSellers.length).toBeGreaterThan(0);
  });
});

describe("admin catalog management", () => {
  it("creates, updates and deletes a book", async () => {
    const admin = await demo("admin");
    const authors = (await request(app).get("/api/v1/authors")).body.items;
    const genres = (await request(app).get("/api/v1/genres")).body.items;

    const created = await admin
      .post("/api/v1/admin/books")
      .send({ ...validBook, authorId: authors[0].id, genreIds: [genres[0].id, genres[1].id] })
      .expect(201);
    const { book } = created.body;
    expect(book).toMatchObject({ slug: "the-test-driven-novel", priceCents: 1999 });
    expect(book.genres).toHaveLength(2);

    const found = await request(app).get("/api/v1/books?q=test-driven").expect(200);
    expect(found.body.items[0].id).toBe(book.id);

    const updated = await admin
      .put(`/api/v1/admin/books/${book.id}`)
      .send({
        ...validBook,
        title: "The Test-Driven Novel, 2nd Ed.",
        authorId: authors[0].id,
        genreIds: [],
      })
      .expect(200);
    expect(updated.body.book.slug).toBe("the-test-driven-novel-2nd-ed");
    expect(updated.body.book.genres).toHaveLength(0);

    // The demo admin can delete books it created...
    await admin.delete(`/api/v1/admin/books/${book.id}`).expect(204);
    await request(app).get(`/api/v1/books/${updated.body.book.slug}`).expect(404);
  });

  it("protects the seeded catalog from the shared demo admin", async () => {
    const admin = await demo("admin");
    const hobbit = (await request(app).get("/api/v1/books/the-hobbit")).body.book;
    const res = await admin.delete(`/api/v1/admin/books/${hobbit.id}`).expect(403);
    expect(res.body.error.message).toMatch(/demo admin/i);
  });

  it("validates book input", async () => {
    const admin = await demo("admin");
    const res = await admin
      .post("/api/v1/admin/books")
      .send({ ...validBook, isbn: "123", priceCents: -5 })
      .expect(400);
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(["isbn", "priceCents", "authorId"]),
    );
  });

  it("rejects a duplicate ISBN with 409", async () => {
    const admin = await demo("admin");
    const authors = (await request(app).get("/api/v1/authors")).body.items;
    const res = await admin
      .post("/api/v1/admin/books")
      .send({ ...validBook, isbn: "9780547928227", authorId: authors[0].id })
      .expect(409);
    expect(res.body.error.code).toBe("DUPLICATE");
  });

  it("won't delete an author who still has books", async () => {
    const admin = await demo("admin");
    const austen = (await request(app).get("/api/v1/authors")).body.items.find(
      (a: { name: string }) => a.name === "Jane Austen",
    );
    await admin.delete(`/api/v1/admin/authors/${austen.id}`).expect(409);
    const created = await admin
      .post("/api/v1/admin/authors")
      .send({ name: "Temporary Author" })
      .expect(201);
    await admin.delete(`/api/v1/admin/authors/${created.body.author.id}`).expect(204);
  });
});

describe("admin orders", () => {
  it("lists all orders and returns stock when an order is cancelled", async () => {
    const customer = await newCustomer();
    const book = await makeBook({ stock: 4 });
    await customer.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 3 }).expect(200);
    const { order } = (
      await customer
        .post("/api/v1/orders")
        .send({
          shipping: {
            fullName: "A B",
            line1: "1 Road",
            city: "Town",
            postalCode: "123",
            country: "Land",
          },
        })
        .expect(201)
    ).body;
    expect(await stockOf(book.id)).toBe(1);

    const admin = await demo("admin");
    const list = await admin.get("/api/v1/admin/orders?limit=50").expect(200);
    expect(list.body.items[0]).toHaveProperty("customer.email");

    await admin.patch(`/api/v1/admin/orders/${order.id}`).send({ status: "CANCELLED" }).expect(200);
    expect(await stockOf(book.id)).toBe(4);

    const again = await admin
      .patch(`/api/v1/admin/orders/${order.id}`)
      .send({ status: "SHIPPED" })
      .expect(409);
    expect(again.body.error.code).toBe("ORDER_FINAL");
  });
});

describe("api docs", () => {
  it("serves an OpenAPI document", async () => {
    const res = await request(app).get("/api/openapi.json").expect(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(Object.keys(res.body.paths)).toContain("/v1/orders");
  });
});
