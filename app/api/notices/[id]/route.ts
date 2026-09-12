import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { objectIdSchema } from "@/lib/validations/common";
import { noticeInputSchema, noticeStatusSchema } from "@/lib/validations/notice";
import { getNoticeById, updateNotice, setNoticeStatus, deleteNotice } from "@/lib/services/notice.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const { id } = await params;
    const noticeId = objectIdSchema.parse(id);
    const data = await getNoticeById(noticeId);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const noticeId = objectIdSchema.parse(id);
    const body = await request.json();

    if (body.action === "status") {
      const { status } = noticeStatusSchema.parse(body);
      const updated = await setNoticeStatus(noticeId, status);
      return ok(updated);
    }

    const input = noticeInputSchema.parse(body);
    const updated = await updateNotice(noticeId, input);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const noticeId = objectIdSchema.parse(id);
    await deleteNotice(noticeId);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
