import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  shippingFor,
  type CheckoutInput,
  type Order,
  type OrderStatus,
  type Paginated,
} from "@bookstore/shared";
import { db } from "../db/client";
import { books, cartItems, orderItems, orders, users } from "../db/schema";
import { badRequest, conflict, notFound } from "../lib/errors";

type OrderRow = typeof orders.$inferSelect;

async function itemsFor(orderIds: number[]) {
  const map = new Map<number, Order["items"]>();
  if (orderIds.length === 0) return map;
  const rows = await db
    .select({
      orderId: orderItems.orderId,
      bookId: orderItems.bookId,
      title: orderItems.title,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      coverUrl: books.coverUrl,
      slug: books.slug,
    })
    .from(orderItems)
    .leftJoin(books, eq(orderItems.bookId, books.id))
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(asc(orderItems.id));
  for (const { orderId, ...item } of rows) {
    const list = map.get(orderId) ?? [];
    list.push({
      ...item,
      bookId: item.bookId ?? 0,
      slug: item.slug ?? "",
      coverUrl: item.coverUrl ?? null,
    });
    map.set(orderId, list);
  }
  return map;
}

function toOrder(row: OrderRow, items: Order["items"]): Order {
  return {
    id: row.id,
    status: row.status,
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
    createdAt: row.createdAt.toISOString(),
    shipping: {
      fullName: row.shipFullName,
      line1: row.shipLine1,
      line2: row.shipLine2,
      city: row.shipCity,
      postalCode: row.shipPostalCode,
      country: row.shipCountry,
    },
    items,
  };
}

export async function checkout(userId: number, input: CheckoutInput): Promise<Order> {
  const orderId = await db.transaction(async (tx) => {
    const lines = await tx
      .select({
        bookId: books.id,
        title: books.title,
        priceCents: books.priceCents,
        stock: books.stock,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(asc(books.id))
      .for("update", { of: books }); // lock in id order to avoid deadlocks

    if (lines.length === 0) throw badRequest("Your cart is empty", "CART_EMPTY");

    const short = lines.filter((l) => l.quantity > l.stock);
    if (short.length) {
      throw conflict(
        "Some items no longer have enough stock",
        "OUT_OF_STOCK",
        Object.fromEntries(
          short.map((l) => [String(l.bookId), [`Only ${l.stock} left of "${l.title}"`]]),
        ),
      );
    }

    const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);
    const { shipping } = input;

    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        // no real payments, so straight to paid
        status: "PAID",
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        shipFullName: shipping.fullName,
        shipLine1: shipping.line1,
        shipLine2: shipping.line2 || null,
        shipCity: shipping.city,
        shipPostalCode: shipping.postalCode,
        shipCountry: shipping.country,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order!.id,
        bookId: l.bookId,
        title: l.title,
        unitPriceCents: l.priceCents,
        quantity: l.quantity,
      })),
    );

    for (const l of lines) {
      await tx
        .update(books)
        .set({ stock: sql`${books.stock} - ${l.quantity}` })
        .where(eq(books.id, l.bookId));
    }

    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    return order!.id;
  });

  return getOrder(orderId);
}

export async function getOrder(id: number, userId?: number): Promise<Order> {
  const row = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!row || (userId !== undefined && row.userId !== userId)) throw notFound("Order");
  const items = await itemsFor([id]);
  return toOrder(row, items.get(id) ?? []);
}

export async function listOrders(opts: {
  userId?: number;
  page: number;
  limit: number;
}): Promise<Paginated<Order>> {
  const where = opts.userId !== undefined ? eq(orders.userId, opts.userId) : undefined;
  const [rows, [{ total } = { total: 0 }]] = await Promise.all([
    db
      .select({ order: orders, customer: { id: users.id, name: users.name, email: users.email } })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(where)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(orders)
      .where(where),
  ]);
  const items = await itemsFor(rows.map((r) => r.order.id));
  return {
    items: rows.map((r) => ({
      ...toOrder(r.order, items.get(r.order.id) ?? []),
      customer: r.customer,
    })),
    total,
    page: opts.page,
    limit: opts.limit,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

// cancelling puts the books back in stock
export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!row) throw notFound("Order");
    if (row.status === status) return;
    if (row.status === "CANCELLED")
      throw conflict("Cancelled orders can't be changed", "ORDER_FINAL");

    if (status === "CANCELLED") {
      const items = await tx
        .select({ bookId: orderItems.bookId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));
      for (const item of items) {
        if (item.bookId === null) continue;
        await tx
          .update(books)
          .set({ stock: sql`${books.stock} + ${item.quantity}` })
          .where(eq(books.id, item.bookId));
      }
    }
    await tx.update(orders).set({ status }).where(eq(orders.id, id));
  });
  return getOrder(id);
}
