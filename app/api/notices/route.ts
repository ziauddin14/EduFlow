import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { noticeInputSchema } from "@/lib/validations/notice";
import { listNotices, createNotice } from "@/lib/services/notice.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const searchParams = request.nextUrl.searchParams;
    const notices = await listNotices({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      viewerRole: session.user.role,
    });
    return ok(notices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN"]);
    const body = noticeInputSchema.parse(await request.json());
    const created = await createNotice(body, session.user.id);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
