import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import type { Role } from "@/types";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/**
 * Verifies the current request is authenticated and, if `roles` is given,
 * that the session role is one of the allowed roles. API routes must call
 * this themselves — middleware only protects page navigation.
 */
export async function requireRole(roles?: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (roles && !roles.includes(session.user.role)) {
    throw new ForbiddenError("You do not have permission to perform this action.");
  }

  return session;
}
