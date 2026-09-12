import type { NextRequest } from "next/server";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { resultsBulkInputSchema } from "@/lib/validations/result";
import { getResultsForExam, saveResultsForExam } from "@/lib/services/result.service";
import { getExamById } from "@/lib/services/exam.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

async function assertExamAccess(role: string, userId: string, examId: string) {
  if (role !== "TEACHER") return;
  const exam = await getExamById(examId);
  const allowed = await getTeacherClassIds(userId);
  const classId = (exam.class as { _id: string })?._id?.toString();
  if (!classId || !allowed.includes(classId)) {
    throw new ForbiddenError("You are not assigned to this class.");
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
    const examId = objectIdSchema.parse(request.nextUrl.searchParams.get("examId"));
    await assertExamAccess(session.user.role, session.user.id, examId);

    const data = await getResultsForExam(examId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const body = resultsBulkInputSchema.parse(await request.json());
    await assertExamAccess(session.user.role, session.user.id, body.exam);

    const saved = await saveResultsForExam(body);
    return ok(saved, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
