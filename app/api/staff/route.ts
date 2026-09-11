import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { staffInputSchema } from "@/lib/validations/teacher";
import { listStaff, createStaff } from "@/lib/services/staff.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const staff = await listStaff(search);
    return ok(staff);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = staffInputSchema.parse(await request.json());
    const created = await createStaff(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
