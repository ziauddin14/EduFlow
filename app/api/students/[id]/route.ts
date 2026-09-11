import type { NextRequest } from "next/server";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { studentInputSchema } from "@/lib/validations/student";
import { getStudentDetail, updateStudent, deleteStudent } from "@/lib/services/student.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const { id } = await params;
    const studentId = objectIdSchema.parse(id);
    const data = await getStudentDetail(studentId);

    if (session.user.role === "TEACHER") {
      const allowedClassIds = await getTeacherClassIds(session.user.id);
      const studentClassId = (data.student.class as { _id: string })?._id?.toString();
      if (!studentClassId || !allowedClassIds.includes(studentClassId)) {
        throw new ForbiddenError("You do not have access to this student.");
      }
    }

    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await params;
    const studentId = objectIdSchema.parse(id);
    const body = studentInputSchema.parse(await request.json());
    const updated = await updateStudent(studentId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const studentId = objectIdSchema.parse(id);
    await deleteStudent(studentId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
