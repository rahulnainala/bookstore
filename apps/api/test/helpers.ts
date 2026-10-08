import { eq } from "drizzle-orm";
import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db/client";
import { authors, books } from "../src/db/schema";

export const app = createApp();

export type Agent = ReturnType<typeof request.agent>;

let counter = 0;
let testAuthorId: number | undefined;

export async function newCustomer(): Promise<Agent> {
  const agent = request.agent(app);
  counter += 1;
  await agent
    .post("/api/v1/auth/register")
    .send({
      name: `Tester ${counter}`,
      email: `tester-${Date.now()}-${counter}@example.com`,
      password: "password123",
    })
    .expect(201);
  return agent;
}

export async function demo(role: "customer" | "admin"): Promise<Agent> {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/demo").send({ role }).expect(200);
  return agent;
}

export async function makeBook(overrides: Partial<typeof books.$inferInsert> = {}) {
  testAuthorId ??= (await db.insert(authors).values({ name: "Fixture Author" }).returning())[0]!.id;
  counter += 1;
  const [book] = await db
    .insert(books)
    .values({
      title: `Test Book ${counter}`,
      slug: `test-book-${Date.now()}-${counter}`,
      isbn: `979${String(Date.now()).slice(-7)}${String(counter).padStart(3, "0")}`,
      priceCents: 1000,
      stock: 5,
      authorId: testAuthorId,
      ...overrides,
    })
    .returning();
  return book!;
}

export async function stockOf(bookId: number) {
  const row = await db.query.books.findFirst({
    where: eq(books.id, bookId),
    columns: { stock: true },
  });
  return row?.stock;
}

export { authors, books, db, request };
