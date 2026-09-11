import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import {
  admissionInputSchema,
  admissionStatusSchema,
  admissionEnrollSchema,
} from "@/lib/validations/admission";
import {
  getAdmissionById,
  updateAdmission,
  setAdmissionStatus,
  approveAndEnroll,
  deleteAdmission,
} from "@/lib/services/admission.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await params;
    const admissionId = objectIdSchema.parse(id);
    const data = await getAdmissionById(admissionId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await params;
    const admissionId = objectIdSchema.parse(id);
    const body = await request.json();

    if (body.action === "status") {
      const { status } = admissionStatusSchema.parse(body);
      const updated = await setAdmissionStatus(admissionId, status);
      return ok(updated);
    }

    if (body.action === "enroll") {
      const enrollInput = admissionEnrollSchema.parse(body);
      const student = await approveAndEnroll(admissionId, enrollInput);
      return ok(student);
    }

    const input = admissionInputSchema.parse(body);
    const updated = await updateAdmission(admissionId, input);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const admissionId = objectIdSchema.parse(id);
    await deleteAdmission(admissionId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
