import { ZodError } from "zod";
import { AppError, ValidationError } from "@/server/errors";

/**
 * Helpers shared by every API route.
 *
 * `route()` wraps a handler so we never repeat try/catch: any error thrown inside
 * (validation, not found, conflict, unexpected) becomes a JSON response with a
 * consistent shape: { error: { message, code, details? } }.
 */

export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const details = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const firstMessage = error.issues[0]?.message ?? "Invalid input";
    return json({ error: { message: firstMessage, code: "VALIDATION_ERROR", details } }, 400);
  }

  if (error instanceof AppError) {
    return json({ error: { message: error.message, code: error.code, details: error.details } }, error.status);
  }

  console.error("Unexpected API error:", error);
  return json({ error: { message: "Something went wrong on our side. Please try again.", code: "INTERNAL_ERROR" } }, 500);
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}

/** Next.js passes dynamic URL segments (like :id) as a promise. */
export type RouteContext<Params extends Record<string, string>> = { params: Promise<Params> };
