import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { timetableEntryInputSchema } from "@/lib/validations/timetable";
import { getSlotById, updateTimetableEntry, deleteTimetableEntry } from "@/lib/services/timetable.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "TEACHER", "STAFF"]);
    const { id } = await params;
    const slotId = objectIdSchema.parse(id);
    const data = await getSlotById(slotId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const slotId = objectIdSchema.parse(id);
    const body = timetableEntryInputSchema.parse(await request.json());
    const updated = await updateTimetableEntry(slotId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const slotId = objectIdSchema.parse(id);
    await deleteTimetableEntry(slotId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
