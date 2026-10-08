import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { sql } from "drizzle-orm";
import swaggerUi from "swagger-ui-express";
import { db } from "./db/client";
import { env } from "./env";
import { loadUser } from "./lib/auth";
import { errorHandler, notFoundHandler } from "./lib/errors";
import { logger } from "./logger";
import { buildOpenApiDocument } from "./openapi";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { cartRouter } from "./routes/cart";
import { catalogRouter } from "./routes/catalog";
import { ordersRouter } from "./routes/orders";

export function createApp() {
  const app = express();
  // Proxies sit in front of the API; trust them so req.ip (used for rate limiting) is the client.
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  // The API only serves JSON; CSP is relaxed so Swagger UI's assets load.
  app.use(helmet({ contentSecurityPolicy: false }));
  if (env.CORS_ORIGIN) {
    const origin = env.CORS_ORIGIN;
    app.use((req, res, next) => {
      if (req.headers.origin === origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") return res.status(204).end();
      next();
    });
  }
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", async (_req, res) => {
    await db.execute(sql`select 1`);
    res.json({ status: "ok" });
  });

  const openapi = buildOpenApiDocument();
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openapi);
  });
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "Bookstore API docs" }),
  );

  const v1 = express.Router();
  v1.use(loadUser);
  v1.use("/auth", authRouter);
  v1.use("/cart", cartRouter);
  v1.use("/orders", ordersRouter);
  v1.use("/admin", adminRouter);
  v1.use(catalogRouter);
  app.use("/api/v1", v1);

  app.get("/", (_req, res) => {
    res.redirect("/api/docs");
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
