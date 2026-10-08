import type { CookieOptions, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import type { User } from "@bookstore/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { env, isProd } from "../env";
import { forbidden, unauthorized } from "./errors";

export const SESSION_COOKIE = "bookstore_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

export function setSessionCookie(res: Response, userId: number) {
  const token = jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

export function toPublicUser(row: typeof users.$inferSelect): User {
  return { id: row.id, name: row.name, email: row.email, role: row.role, isDemo: row.isDemo };
}

// Looks the user up on every request so a deleted user / db reset logs them out.
export const loadUser: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    const userId = Number(typeof payload === "string" ? NaN : payload.sub);
    if (!Number.isInteger(userId)) throw new Error("bad subject");
    const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (row) req.user = toPublicUser(row);
    else clearSessionCookie(res);
  } catch {
    clearSessionCookie(res);
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== "ADMIN") return next(forbidden("Admins only"));
  next();
};

export function currentUser(req: { user?: User }): User {
  if (!req.user) throw unauthorized();
  return req.user;
}
