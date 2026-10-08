import { describe, expect, it } from "vitest";
import { app, newCustomer, request } from "./helpers";

describe("catalog", () => {
  it("paginates books", async () => {
    const res = await request(app).get("/api/v1/books?limit=5&page=2").expect(200);
    expect(res.body.items).toHaveLength(5);
    expect(res.body).toMatchObject({ page: 2, limit: 5 });
    expect(res.body.total).toBeGreaterThan(50);
    expect(res.body.items[0]).toHaveProperty("author.name");
    expect(res.body.items[0]).toHaveProperty("genres");
  });

  it("searches by title, author and ISBN", async () => {
    const byAuthor = await request(app).get("/api/v1/books?q=tolkien").expect(200);
    expect(byAuthor.body.items.map((b: { title: string }) => b.title).sort()).toEqual([
      "The Fellowship of the Ring",
      "The Hobbit",
    ]);
    const byTitle = await request(app).get("/api/v1/books?q=hobb").expect(200);
    expect(byTitle.body.items[0].title).toBe("The Hobbit");
    const byIsbn = await request(app).get("/api/v1/books?q=978-0441172719").expect(200);
    expect(byIsbn.body.items[0].title).toBe("Dune");
  });

  it("treats LIKE wildcards in search as plain text", async () => {
    const res = await request(app).get("/api/v1/books?q=%25").expect(200);
    expect(res.body.total).toBe(0);
  });

  it("filters by genre, price range and stock", async () => {
    const res = await request(app)
      .get("/api/v1/books?genre=fantasy&minPrice=1000&maxPrice=1200&inStock=true&limit=48")
      .expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    for (const b of res.body.items) {
      expect(b.genres.map((g: { slug: string }) => g.slug)).toContain("fantasy");
      expect(b.priceCents).toBeGreaterThanOrEqual(1000);
      expect(b.priceCents).toBeLessThanOrEqual(1200);
      expect(b.stock).toBeGreaterThan(0);
    }
  });

  it("sorts by price", async () => {
    const res = await request(app).get("/api/v1/books?sort=price_asc&limit=20").expect(200);
    const prices = res.body.items.map((b: { priceCents: number }) => b.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("rejects invalid query params", async () => {
    const res = await request(app).get("/api/v1/books?sort=random&limit=1000").expect(400);
    expect(Object.keys(res.body.error.details).sort()).toEqual(["limit", "sort"]);
  });

  it("returns book detail with related books, and 404 for unknown slugs", async () => {
    const res = await request(app).get("/api/v1/books/the-hobbit").expect(200);
    expect(res.body.book).toMatchObject({ title: "The Hobbit", pages: 300 });
    expect(res.body.book.description.length).toBeGreaterThan(20);
    expect(res.body.related.length).toBeGreaterThan(0);
    expect(res.body.related.map((b: { slug: string }) => b.slug)).not.toContain("the-hobbit");
    await request(app).get("/api/v1/books/no-such-book").expect(404);
  });

  it("lists genres and authors with counts", async () => {
    const genres = await request(app).get("/api/v1/genres").expect(200);
    expect(
      genres.body.items.find((g: { slug: string }) => g.slug === "fantasy").bookCount,
    ).toBeGreaterThan(5);
    const authors = await request(app).get("/api/v1/authors").expect(200);
    const austen = authors.body.items.find((a: { name: string }) => a.name === "Jane Austen");
    expect(austen.bookCount).toBe(2);
    const detail = await request(app).get(`/api/v1/authors/${austen.id}`).expect(200);
    expect(detail.body.books).toHaveLength(2);
  });
});

describe("reviews", () => {
  it("requires sign-in to review", async () => {
    await request(app).put("/api/v1/books/1/reviews").send({ rating: 5 }).expect(401);
  });

  it("creates then updates a single review per user and updates the average", async () => {
    const agent = await newCustomer();
    const book = (await request(app).get("/api/v1/books/dune")).body.book;

    await agent
      .put(`/api/v1/books/${book.id}/reviews`)
      .send({ rating: 1, body: "Not for me" })
      .expect(200);
    await agent
      .put(`/api/v1/books/${book.id}/reviews`)
      .send({ rating: 2, body: "Second thoughts" })
      .expect(200);

    const after = (await request(app).get("/api/v1/books/dune")).body.book;
    expect(after.reviewCount).toBe(book.reviewCount + 1);

    const reviews = await request(app).get(`/api/v1/books/${book.id}/reviews`).expect(200);
    const mine = reviews.body.items.filter((r: { body: string }) => r.body === "Second thoughts");
    expect(mine).toHaveLength(1);
    expect(mine[0].rating).toBe(2);

    await agent.delete(`/api/v1/books/${book.id}/reviews`).expect(204);
    const final = (await request(app).get("/api/v1/books/dune")).body.book;
    expect(final.reviewCount).toBe(book.reviewCount);
  });

  it("rejects ratings outside 1-5", async () => {
    const agent = await newCustomer();
    await agent.put("/api/v1/books/1/reviews").send({ rating: 6 }).expect(400);
  });
});
