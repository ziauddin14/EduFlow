import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { subjectInputSchema } from "@/lib/validations/subject";
import { listSubjects, createSubject } from "@/lib/services/subject.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole();
    const searchParams = request.nextUrl.searchParams;
    const subjects = await listSubjects({
      classId: searchParams.get("classId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return ok(subjects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = subjectInputSchema.parse(await request.json());
    const created = await createSubject(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
