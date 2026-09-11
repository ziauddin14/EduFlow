import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { attendanceMarkSchema } from "@/lib/validations/attendance";
import {
  getAttendanceForDate,
  saveAttendance,
  getClassAttendancePercentage,
  getAttendanceHistory,
} from "@/lib/services/attendance.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

const getQuerySchema = z.object({
  classId: objectIdSchema,
  section: z.string().min(1),
  date: z.coerce.date().optional(),
});

async function assertClassAccess(role: string, userId: string, classId: string) {
  if (role !== "TEACHER") return;
  const allowed = await getTeacherClassIds(userId);
  if (!allowed.includes(classId)) {
    throw new ForbiddenError("You are not assigned to this class.");
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const query = getQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    await assertClassAccess(session.user.role, session.user.id, query.classId);

    if (!query.date) {
      const history = await getAttendanceHistory(query.classId, query.section);
      return ok({ history });
    }

    const [data, classPercentage] = await Promise.all([
      getAttendanceForDate(query.classId, query.section, query.date),
      getClassAttendancePercentage(query.classId, query.section),
    ]);
    return ok({ ...data, classPercentage });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const body = attendanceMarkSchema.parse(await request.json());
    await assertClassAccess(session.user.role, session.user.id, body.class);

    const saved = await saveAttendance(body, session.user.id);
    return ok(saved, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
