import { Router } from "express";
import { z } from "zod";
import { cartItemInputSchema, cartMergeSchema } from "@bookstore/shared";
import { currentUser, requireAuth } from "../lib/auth";
import { parse } from "../lib/validate";
import { getCart, mergeCart, removeCartItem, setCartItem } from "../services/cart";

export const cartRouter = Router();
cartRouter.use(requireAuth);

const bookIdParam = z.object({ bookId: z.coerce.number().int().positive() });

cartRouter.get("/", async (req, res) => {
  res.json(await getCart(currentUser(req).id));
});

cartRouter.put("/items/:bookId", async (req, res) => {
  const { bookId } = parse(bookIdParam, req, "params");
  const { quantity } = parse(cartItemInputSchema, req);
  res.json(await setCartItem(currentUser(req).id, bookId, quantity));
});

cartRouter.delete("/items/:bookId", async (req, res) => {
  const { bookId } = parse(bookIdParam, req, "params");
  res.json(await removeCartItem(currentUser(req).id, bookId));
});

cartRouter.post("/merge", async (req, res) => {
  res.json(await mergeCart(currentUser(req).id, parse(cartMergeSchema, req)));
});
