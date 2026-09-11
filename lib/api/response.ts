import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/requireRole";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { ApiResponse } from "@/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function fail(message: string, status: number) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error: message }, { status });
}

/**
 * Central error translator for API route handlers. Keeps client-facing
 * messages generic for unexpected errors while surfacing validation and
 * auth failures with their proper status codes, per the security baseline
 * (no stack traces / internal details returned to the client).
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.issues.map((issue) => issue.message).join("; "), 400);
  }
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return fail(error.message, 403);
  }
  if (error instanceof NotFoundError) {
    return fail(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return fail(error.message, 409);
  }

  console.error(error);
  return fail("Something went wrong. Please try again.", 500);
}
