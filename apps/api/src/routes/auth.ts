import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { demoLoginSchema, loginSchema, registerSchema } from "@bookstore/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { DEMO_ACCOUNTS } from "../db/demo-accounts";
import { env } from "../env";
import {
  clearSessionCookie,
  currentUser,
  requireAuth,
  setSessionCookie,
  toPublicUser,
} from "../lib/auth";
import { conflict, HttpError, unauthorized } from "../lib/errors";
import { parse } from "../lib/validate";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === "test" ? 1000 : 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new HttpError(429, "RATE_LIMITED", "Too many attempts, please try again in a few minutes"),
    ),
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const input = parse(registerSchema, req);
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) throw conflict("An account with that email already exists", "EMAIL_TAKEN");
  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
    })
    .returning();
  setSessionCookie(res, user!.id);
  res.status(201).json({ user: toPublicUser(user!) });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const input = parse(loginSchema, req);
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  // Compare even when the user doesn't exist so response timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv",
  );
  if (!user || !ok) throw unauthorized("Incorrect email or password");
  setSessionCookie(res, user.id);
  res.json({ user: toPublicUser(user) });
});

/** One-click sign-in as a seeded demo account, so visitors can try the store without signing up. */
authRouter.post("/demo", authLimiter, async (req, res) => {
  const { role } = parse(demoLoginSchema, req);
  const email = DEMO_ACCOUNTS[role].email;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user)
    throw new HttpError(
      503,
      "DEMO_UNAVAILABLE",
      "Demo accounts are being reset, try again shortly",
    );
  setSessionCookie(res, user.id);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});
