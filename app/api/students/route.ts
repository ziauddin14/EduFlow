import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { studentInputSchema, studentListQuerySchema } from "@/lib/validations/student";
import { listStudents, createStudent } from "@/lib/services/student.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const query = studentListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const restrictToClassIds =
      session.user.role === "TEACHER" ? await getTeacherClassIds(session.user.id) : undefined;

    const result = await listStudents({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search || undefined,
      classId: query.classId || undefined,
      status: query.status || undefined,
      restrictToClassIds,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = studentInputSchema.parse(await request.json());
    const created = await createStudent(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
