import type { NextRequest } from "next/server";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { examInputSchema } from "@/lib/validations/exam";
import { getExamById, updateExam, deleteExam } from "@/lib/services/exam.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
    const { id } = await params;
    const examId = objectIdSchema.parse(id);
    const exam = await getExamById(examId);

    if (session.user.role === "TEACHER") {
      const allowed = await getTeacherClassIds(session.user.id);
      const classId = (exam.class as { _id: string })?._id?.toString();
      if (!classId || !allowed.includes(classId)) {
        throw new ForbiddenError("You are not assigned to this class.");
      }
    }

    return ok(exam);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const examId = objectIdSchema.parse(id);
    const body = examInputSchema.parse(await request.json());
    const updated = await updateExam(examId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const examId = objectIdSchema.parse(id);
    await deleteExam(examId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
