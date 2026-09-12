import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, fail, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { timetableEntryInputSchema } from "@/lib/validations/timetable";
import { getWeeklyTimetable, getTeacherWeeklyTimetable, createTimetableEntry } from "@/lib/services/timetable.service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "TEACHER", "STAFF"]);
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");

    if (teacherId) {
      const week = await getTeacherWeeklyTimetable(objectIdSchema.parse(teacherId));
      return ok(week);
    }

    const classId = objectIdSchema.parse(searchParams.get("classId"));
    const section = searchParams.get("section");
    if (!section) {
      return fail("section is required.", 400);
    }

    const week = await getWeeklyTimetable(classId, section);
    return ok(week);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = timetableEntryInputSchema.parse(await request.json());
    const created = await createTimetableEntry(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
