import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { classInputSchema } from "@/lib/validations/class";
import { getClassById, updateClass, deleteClass } from "@/lib/services/class.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole();
    const { id } = await params;
    const classId = objectIdSchema.parse(id);
    const data = await getClassById(classId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const classId = objectIdSchema.parse(id);
    const body = classInputSchema.parse(await request.json());
    const updated = await updateClass(classId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const classId = objectIdSchema.parse(id);
    await deleteClass(classId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
