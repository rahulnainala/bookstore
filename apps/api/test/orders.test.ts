import { describe, expect, it } from "vitest";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "@bookstore/shared";
import { app, books, db, makeBook, newCustomer, request, stockOf } from "./helpers";
import { eq } from "drizzle-orm";

const shipping = {
  fullName: "Test Buyer",
  line1: "1 Test Street",
  city: "Testville",
  postalCode: "12345",
  country: "Testland",
};

describe("cart", () => {
  it("requires sign-in", async () => {
    await request(app).get("/api/v1/cart").expect(401);
  });

  it("adds, updates and removes items and computes the subtotal", async () => {
    const agent = await newCustomer();
    const a = await makeBook({ priceCents: 1250, stock: 10 });
    const b = await makeBook({ priceCents: 800, stock: 10 });

    await agent.put(`/api/v1/cart/items/${a.id}`).send({ quantity: 2 }).expect(200);
    const res = await agent.put(`/api/v1/cart/items/${b.id}`).send({ quantity: 1 }).expect(200);
    expect(res.body.subtotalCents).toBe(2 * 1250 + 800);

    const updated = await agent.put(`/api/v1/cart/items/${a.id}`).send({ quantity: 1 }).expect(200);
    expect(updated.body.subtotalCents).toBe(1250 + 800);

    const removed = await agent.delete(`/api/v1/cart/items/${b.id}`).expect(200);
    expect(removed.body.items).toHaveLength(1);
  });

  it("caps quantity at available stock and refuses sold-out books", async () => {
    const agent = await newCustomer();
    const few = await makeBook({ stock: 2 });
    const none = await makeBook({ stock: 0 });
    const res = await agent.put(`/api/v1/cart/items/${few.id}`).send({ quantity: 9 }).expect(200);
    expect(res.body.items[0].quantity).toBe(2);
    const err = await agent.put(`/api/v1/cart/items/${none.id}`).send({ quantity: 1 }).expect(400);
    expect(err.body.error.code).toBe("OUT_OF_STOCK");
  });

  it("merges a guest cart, adding quantities and dropping unknown books", async () => {
    const agent = await newCustomer();
    const book = await makeBook({ stock: 10 });
    await agent.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 2 }).expect(200);
    const res = await agent
      .post("/api/v1/cart/merge")
      .send({
        items: [
          { bookId: book.id, quantity: 3 },
          { bookId: 99999999, quantity: 1 },
        ],
      })
      .expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(5);
  });
});

describe("checkout", () => {
  it("creates a paid order, snapshots prices, decrements stock and empties the cart", async () => {
    const agent = await newCustomer();
    const book = await makeBook({ priceCents: 1000, stock: 5 });
    await agent.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 2 }).expect(200);

    const res = await agent.post("/api/v1/orders").send({ shipping }).expect(201);
    const { order } = res.body;
    expect(order.status).toBe("PAID");
    expect(order.subtotalCents).toBe(2000);
    expect(order.shippingCents).toBe(
      2000 >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS,
    );
    expect(order.totalCents).toBe(order.subtotalCents + order.shippingCents);
    expect(order.items[0]).toMatchObject({ bookId: book.id, quantity: 2, unitPriceCents: 1000 });

    expect(await stockOf(book.id)).toBe(3);
    expect((await agent.get("/api/v1/cart")).body.items).toHaveLength(0);

    // Later price changes don't rewrite history.
    await db.update(books).set({ priceCents: 5000 }).where(eq(books.id, book.id));
    const fetched = await agent.get(`/api/v1/orders/${order.id}`).expect(200);
    expect(fetched.body.order.items[0].unitPriceCents).toBe(1000);

    const history = await agent.get("/api/v1/orders").expect(200);
    expect(history.body.items.map((o: { id: number }) => o.id)).toContain(order.id);
  });

  it("gives free shipping above the threshold", async () => {
    const agent = await newCustomer();
    const book = await makeBook({ priceCents: FREE_SHIPPING_THRESHOLD_CENTS, stock: 5 });
    await agent.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 1 }).expect(200);
    const res = await agent.post("/api/v1/orders").send({ shipping }).expect(201);
    expect(res.body.order.shippingCents).toBe(0);
  });

  it("rejects an empty cart and invalid shipping details", async () => {
    const agent = await newCustomer();
    const empty = await agent.post("/api/v1/orders").send({ shipping }).expect(400);
    expect(empty.body.error.code).toBe("CART_EMPTY");
    const invalid = await agent
      .post("/api/v1/orders")
      .send({ shipping: { ...shipping, city: "" } })
      .expect(400);
    expect(invalid.body.error.details).toHaveProperty("shipping.city");
  });

  it("fails atomically when stock ran out after the item was carted", async () => {
    const agent = await newCustomer();
    const plenty = await makeBook({ stock: 5 });
    const scarce = await makeBook({ stock: 3 });
    await agent.put(`/api/v1/cart/items/${plenty.id}`).send({ quantity: 1 }).expect(200);
    await agent.put(`/api/v1/cart/items/${scarce.id}`).send({ quantity: 3 }).expect(200);
    await db.update(books).set({ stock: 1 }).where(eq(books.id, scarce.id));

    const res = await agent.post("/api/v1/orders").send({ shipping }).expect(409);
    expect(res.body.error.code).toBe("OUT_OF_STOCK");
    expect(res.body.error.details).toHaveProperty(String(scarce.id));
    // Nothing was decremented and the cart is intact.
    expect(await stockOf(plenty.id)).toBe(5);
    expect((await agent.get("/api/v1/cart")).body.items).toHaveLength(2);
  });

  it("never oversells the last copy under concurrent checkouts", async () => {
    const book = await makeBook({ stock: 1 });
    const buyers = await Promise.all([newCustomer(), newCustomer(), newCustomer()]);
    for (const b of buyers)
      await b.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 1 }).expect(200);

    const results = await Promise.all(
      buyers.map((b) => b.post("/api/v1/orders").send({ shipping })),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(await stockOf(book.id)).toBe(0);
  });

  it("hides other customers' orders", async () => {
    const owner = await newCustomer();
    const book = await makeBook();
    await owner.put(`/api/v1/cart/items/${book.id}`).send({ quantity: 1 }).expect(200);
    const { order } = (await owner.post("/api/v1/orders").send({ shipping }).expect(201)).body;
    const other = await newCustomer();
    await other.get(`/api/v1/orders/${order.id}`).expect(404);
  });
});
