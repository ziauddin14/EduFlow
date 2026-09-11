import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { subjectInputSchema } from "@/lib/validations/subject";
import { getSubjectById, updateSubject, deleteSubject } from "@/lib/services/subject.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole();
    const { id } = await params;
    const subjectId = objectIdSchema.parse(id);
    const data = await getSubjectById(subjectId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const subjectId = objectIdSchema.parse(id);
    const body = subjectInputSchema.parse(await request.json());
    const updated = await updateSubject(subjectId, body);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const subjectId = objectIdSchema.parse(id);
    await deleteSubject(subjectId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
