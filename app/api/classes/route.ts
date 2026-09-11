import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { ok, handleApiError } from "@/lib/api/response";
import { classInputSchema } from "@/lib/validations/class";
import { listClassesWithCounts, createClass } from "@/lib/services/class.service";

export async function GET() {
  try {
    await requireRole();
    const classes = await listClassesWithCounts();
    return ok(classes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = classInputSchema.parse(await request.json());
    const created = await createClass(body);
    return ok(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
