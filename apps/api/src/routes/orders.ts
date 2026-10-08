import { Router } from "express";
import { z } from "zod";
import { checkoutSchema, idParam } from "@bookstore/shared";
import { currentUser, requireAuth } from "../lib/auth";
import { parse } from "../lib/validate";
import { checkout, getOrder, listOrders } from "../services/orders";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

ordersRouter.post("/", async (req, res) => {
  const order = await checkout(currentUser(req).id, parse(checkoutSchema, req));
  res.status(201).json({ order });
});

ordersRouter.get("/", async (req, res) => {
  const { page, limit } = parse(pageQuery, req, "query");
  res.json(await listOrders({ userId: currentUser(req).id, page, limit }));
});

ordersRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParam, req, "params");
  res.json({ order: await getOrder(id, currentUser(req).id) });
});
