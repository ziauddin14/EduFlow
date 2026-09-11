import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { staffInputSchema } from "@/lib/validations/teacher";
import { updateStaff, deleteStaff } from "@/lib/services/staff.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const staffId = objectIdSchema.parse(id);
    const body = staffInputSchema.parse(await request.json());
    const updated = await updateStaff(staffId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const staffId = objectIdSchema.parse(id);
    await deleteStaff(staffId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
