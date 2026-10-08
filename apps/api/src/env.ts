import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(8000),
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5432/bookstore"),
  JWT_SECRET: z.string().min(32).default("dev-only-secret-change-me-dev-only-secret"),
  CORS_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

if (isProd && env.JWT_SECRET.startsWith("dev-only-secret")) {
  console.error("JWT_SECRET must be set in production");
  process.exit(1);
}
