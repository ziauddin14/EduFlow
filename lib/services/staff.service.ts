import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Notice } from "@/lib/db/models/Notice";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { StaffInput } from "@/lib/validations/teacher";

const DEFAULT_STAFF_PASSWORD = "Demo@123";

export async function listStaff(search?: string) {
  await connectToDatabase();

  const filter: Record<string, unknown> = { role: "STAFF" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return User.find(filter).select("name email status createdAt").sort({ name: 1 }).lean();
}

export async function createStaff(input: StaffInput) {
  await connectToDatabase();

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError("A user with this email already exists.");
  }

  const hashed = await bcrypt.hash(DEFAULT_STAFF_PASSWORD, 10);
  return User.create({ ...input, password: hashed, role: "STAFF" });
}

export async function updateStaff(id: string, input: StaffInput) {
  await connectToDatabase();

  const duplicate = await User.findOne({ email: input.email, _id: { $ne: id } });
  if (duplicate) {
    throw new ConflictError("A user with this email already exists.");
  }

  const updated = await User.findOneAndUpdate({ _id: id, role: "STAFF" }, input, {
    returnDocument: "after",
  });
  if (!updated) {
    throw new NotFoundError("Staff member not found.");
  }
  return updated;
}

export async function deleteStaff(id: string) {
  await connectToDatabase();

  const noticeCount = await Notice.countDocuments({ createdBy: id });
  if (noticeCount > 0) {
    throw new ConflictError("This staff member has published notices and cannot be deleted.");
  }

  const deleted = await User.findOneAndDelete({ _id: id, role: "STAFF" });
  if (!deleted) {
    throw new NotFoundError("Staff member not found.");
  }
}
