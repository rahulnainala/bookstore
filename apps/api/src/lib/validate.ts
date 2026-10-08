import type { Request } from "express";
import type { z } from "zod";

// throws ZodError -> 400 in the error handler
export function parse<S extends z.ZodType>(
  schema: S,
  req: Request,
  part: "body" | "query" | "params" = "body",
): z.output<S> {
  return schema.parse(req[part] ?? {});
}
