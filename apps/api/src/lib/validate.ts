import type { Request } from "express";
import type { z } from "zod";

/**
 * Parse a part of the request with a Zod schema. Throws a ZodError (turned into a 400 by the
 * error handler) when the input is invalid, and returns the typed, transformed value otherwise.
 */
export function parse<S extends z.ZodType>(
  schema: S,
  req: Request,
  part: "body" | "query" | "params" = "body",
): z.output<S> {
  return schema.parse(req[part] ?? {});
}
