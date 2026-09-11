import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { teacherInputSchema } from "@/lib/validations/teacher";
import { listTeachers, createTeacher } from "@/lib/services/teacher.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const teachers = await listTeachers(search);
    return ok(teachers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = teacherInputSchema.parse(await request.json());
    const created = await createTeacher(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
