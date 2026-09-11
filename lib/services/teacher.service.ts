import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
import { User } from "@/lib/db/models/User";
import { Class } from "@/lib/db/models/Class";
import { Subject } from "@/lib/db/models/Subject";
import { Timetable } from "@/lib/db/models/Timetable";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { TeacherInput } from "@/lib/validations/teacher";

const DEFAULT_TEACHER_PASSWORD = "Demo@123";

/** Lightweight teacher list for assignment dropdowns (Class/Subject forms). */
export async function listTeachersForSelect() {
  await connectToDatabase();
  return Teacher.find({ status: "Active" }).select("name designation").sort({ name: 1 }).lean();
}

/** Class IDs a teacher (by their User ID) is assigned to — used to scope TEACHER reads. */
export async function getTeacherClassIds(userId: string): Promise<string[]> {
  await connectToDatabase();
  const teacher = await Teacher.findOne({ user: userId }).select("classes").lean();
  return (teacher?.classes as Types.ObjectId[] | undefined)?.map((id) => id.toString()) ?? [];
}

export async function listTeachers(search?: string) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }

  return Teacher.find(filter)
    .populate("subjects", "name code")
    .populate("classes", "name")
    .sort({ name: 1 })
    .lean();
}

export async function getTeacherById(id: string) {
  await connectToDatabase();

  const teacher = await Teacher.findById(id)
    .populate("subjects", "name code")
    .populate("classes", "name")
    .lean();
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }
  return teacher;
}

export async function createTeacher(input: TeacherInput) {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new ConflictError("A user with this email already exists.");
  }

  const hashed = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);
  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashed,
    role: "TEACHER",
    status: input.status,
  });

  try {
    return await Teacher.create({ ...input, user: user._id });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
}

export async function updateTeacher(id: string, input: TeacherInput) {
  await connectToDatabase();

  const teacher = await Teacher.findById(id);
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }

  const duplicate = await User.findOne({ email: input.email, _id: { $ne: teacher.user } });
  if (duplicate) {
    throw new ConflictError("A user with this email already exists.");
  }

  await User.findByIdAndUpdate(teacher.user, {
    name: input.name,
    email: input.email,
    status: input.status,
  });

  const updated = await Teacher.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Teacher not found.");
  }
  return updated;
}

export async function deleteTeacher(id: string) {
  await connectToDatabase();

  const teacher = await Teacher.findById(id);
  if (!teacher) {
    throw new NotFoundError("Teacher not found.");
  }

  const [classTeacherCount, subjectCount, timetableCount] = await Promise.all([
    Class.countDocuments({ classTeacher: id }),
    Subject.countDocuments({ teacher: id }),
    Timetable.countDocuments({ "slots.teacher": id }),
  ]);

  if (classTeacherCount > 0 || subjectCount > 0 || timetableCount > 0) {
    throw new ConflictError(
      "This teacher is assigned to a class, subject, or timetable slot. Unassign them first."
    );
  }

  await Teacher.findByIdAndDelete(id);
  await User.findByIdAndDelete(teacher.user);
}
