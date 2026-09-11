import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { teacherInputSchema } from "@/lib/validations/teacher";
import { getTeacherById, updateTeacher, deleteTeacher } from "@/lib/services/teacher.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await params;
    const teacherId = objectIdSchema.parse(id);
    const data = await getTeacherById(teacherId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const teacherId = objectIdSchema.parse(id);
    const body = teacherInputSchema.parse(await request.json());
    const updated = await updateTeacher(teacherId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const teacherId = objectIdSchema.parse(id);
    await deleteTeacher(teacherId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
