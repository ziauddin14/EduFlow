import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { feeInputSchema, feePaymentSchema } from "@/lib/validations/fee";
import { getFeeById, updateFee, recordPayment, deleteFee } from "@/lib/services/fee.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const { id } = await params;
    const feeId = objectIdSchema.parse(id);
    const data = await getFeeById(feeId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await params;
    const feeId = objectIdSchema.parse(id);
    const body = await request.json();

    if (body.action === "payment") {
      const paymentInput = feePaymentSchema.parse(body);
      const updated = await recordPayment(feeId, paymentInput);
      return ok(updated);
    }

    const input = feeInputSchema.parse(body);
    const updated = await updateFee(feeId, input);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const feeId = objectIdSchema.parse(id);
    await deleteFee(feeId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
