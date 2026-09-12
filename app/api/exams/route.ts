import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { examInputSchema } from "@/lib/validations/exam";
import { listExams, createExam } from "@/lib/services/exam.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
    const searchParams = request.nextUrl.searchParams;
    let classId = searchParams.get("classId") ?? undefined;

    if (session.user.role === "TEACHER") {
      const allowed = await getTeacherClassIds(session.user.id);
      if (classId && !allowed.includes(classId)) {
        return ok([]);
      }
      if (!classId) {
        const exams = (
          await Promise.all(allowed.map((id) => listExams({ classId: id, subjectId: searchParams.get("subjectId") ?? undefined })))
        ).flat();
        return ok(exams);
      }
    }

    const exams = await listExams({
      classId,
      subjectId: searchParams.get("subjectId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return ok(exams);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = examInputSchema.parse(await request.json());
    const created = await createExam(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
