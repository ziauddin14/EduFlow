import type { NextRequest } from "next/server";
import { requireRole, ForbiddenError } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { attendanceUpdateSchema } from "@/lib/validations/attendance";
import { getAttendanceRecordById, updateAttendanceRecords } from "@/lib/services/attendance.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const { id } = await params;
    const attendanceId = objectIdSchema.parse(id);
    const record = await getAttendanceRecordById(attendanceId);

    if (session.user.role === "TEACHER") {
      const allowed = await getTeacherClassIds(session.user.id);
      const classId = (record.class as { _id: string })?._id?.toString();
      if (!classId || !allowed.includes(classId)) {
        throw new ForbiddenError("You are not assigned to this class.");
      }
    }

    return ok(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    const { id } = await params;
    const attendanceId = objectIdSchema.parse(id);
    const existing = await getAttendanceRecordById(attendanceId);

    if (session.user.role === "TEACHER") {
      const allowed = await getTeacherClassIds(session.user.id);
      const classId = (existing.class as { _id: string })?._id?.toString();
      if (!classId || !allowed.includes(classId)) {
        throw new ForbiddenError("You are not assigned to this class.");
      }
    }

    const body = attendanceUpdateSchema.parse(await request.json());
    const updated = await updateAttendanceRecords(attendanceId, body, session.user.id);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
