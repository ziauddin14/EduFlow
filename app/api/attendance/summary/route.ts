import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { getDailySummary } from "@/lib/services/attendance.service";

const querySchema = z.object({ date: z.coerce.date() });

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const { date } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const summary = await getDailySummary(date);
    return ok(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
