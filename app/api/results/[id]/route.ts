import type { NextRequest } from "next/server";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { resultUpdateSchema } from "@/lib/validations/result";
import { updateResult, getResultClassId } from "@/lib/services/result.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const { id } = await params;
    const resultId = objectIdSchema.parse(id);

    if (session.user.role === "TEACHER") {
      const classId = await getResultClassId(resultId);
      const allowed = await getTeacherClassIds(session.user.id);
      if (!classId || !allowed.includes(classId)) {
        throw new ForbiddenError("You are not assigned to this class.");
      }
    }

    const { obtainedMarks } = resultUpdateSchema.parse(await request.json());
    const updated = await updateResult(resultId, obtainedMarks);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
