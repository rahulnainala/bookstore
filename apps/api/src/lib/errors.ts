import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";
import type { ApiErrorBody } from "@bookstore/shared";
import { logger } from "../logger";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code = "BAD_REQUEST") =>
  new HttpError(400, code, message);
export const unauthorized = (message = "Please sign in to continue") =>
  new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You don't have permission to do that") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (what = "Resource") => new HttpError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (message: string, code = "CONFLICT", details?: Record<string, string[]>) =>
  new HttpError(409, code, message, details);

export function zodDetails(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
};

const PG_UNIQUE_VIOLATION = "23505";
const PG_FK_VIOLATION = "23503";

function pgCode(err: unknown): string | undefined {
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  const code = e?.code ?? e?.cause?.code;
  return typeof code === "string" ? code : undefined;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let httpErr: HttpError;

  if (err instanceof HttpError) {
    httpErr = err;
  } else if (err instanceof z.ZodError) {
    httpErr = new HttpError(400, "VALIDATION_ERROR", "Some fields are invalid", zodDetails(err));
  } else if (pgCode(err) === PG_UNIQUE_VIOLATION) {
    httpErr = conflict("A record with those details already exists", "DUPLICATE");
  } else if (pgCode(err) === PG_FK_VIOLATION) {
    httpErr = conflict("This record is referenced by other data", "IN_USE");
  } else if ((err as { type?: string })?.type === "entity.parse.failed") {
    httpErr = badRequest("Malformed JSON body", "INVALID_JSON");
  } else {
    (req.log ?? logger).error({ err }, "Unhandled error");
    httpErr = new HttpError(500, "INTERNAL", "Something went wrong on our side");
  }

  const body: ApiErrorBody = {
    error: { code: httpErr.code, message: httpErr.message, details: httpErr.details },
  };
  res.status(httpErr.status).json(body);
};
