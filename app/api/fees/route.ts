import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { feeInputSchema, feeListQuerySchema } from "@/lib/validations/fee";
import { listFees, createFee } from "@/lib/services/fee.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const query = feeListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await listFees(query);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = feeInputSchema.parse(await request.json());
    const created = await createFee(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
