import { connectToDatabase } from "@/lib/db/mongodb";
import { Notice } from "@/lib/db/models/Notice";
import { NotFoundError } from "@/lib/services/errors";
import type { Role, NoticeStatus } from "@/types";
import type { NoticeInput } from "@/lib/validations/notice";

const ROLE_AUDIENCE: Record<Role, string[]> = {
  ADMIN: [],
  TEACHER: ["Everyone", "Teachers"],
  STAFF: ["Everyone", "Staff"],
};

interface ListParams {
  search?: string;
  category?: string;
  status?: string;
  viewerRole: Role;
}

export async function listNotices(params: ListParams) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.search) filter.title = { $regex: params.search, $options: "i" };
  if (params.category) filter.category = params.category;

  if (params.viewerRole === "ADMIN") {
    if (params.status) filter.status = params.status;
  } else {
    filter.status = "Published";
    filter.audience = { $in: ROLE_AUDIENCE[params.viewerRole] };
  }

  return Notice.find(filter).populate("createdBy", "name").sort({ date: -1 }).lean();
}

export async function getNoticeById(id: string) {
  await connectToDatabase();

  const notice = await Notice.findById(id).populate("createdBy", "name").lean();
  if (!notice) {
    throw new NotFoundError("Notice not found.");
  }
  return notice;
}

export async function createNotice(input: NoticeInput, createdBy: string) {
  await connectToDatabase();
  return Notice.create({ ...input, createdBy });
}

export async function updateNotice(id: string, input: NoticeInput) {
  await connectToDatabase();

  const updated = await Notice.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Notice not found.");
  }
  return updated;
}

export async function setNoticeStatus(id: string, status: NoticeStatus) {
  await connectToDatabase();

  const updated = await Notice.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Notice not found.");
  }
  return updated;
}

export async function deleteNotice(id: string) {
  await connectToDatabase();

  const deleted = await Notice.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Notice not found.");
  }
}

export async function getRecentPublishedNotices(limit = 5) {
  await connectToDatabase();
  return Notice.find({ status: "Published" }).sort({ date: -1 }).limit(limit).lean();
}
