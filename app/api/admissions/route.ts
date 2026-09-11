import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { admissionInputSchema } from "@/lib/validations/admission";
import { paginationQuerySchema } from "@/lib/validations/common";
import { listAdmissions, createAdmission } from "@/lib/services/admission.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const query = paginationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const result = await listAdmissions({ ...query, status });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = admissionInputSchema.parse(await request.json());
    const created = await createAdmission(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
