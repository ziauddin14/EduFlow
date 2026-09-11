import { connectToDatabase } from "@/lib/db/mongodb";
import { Subject } from "@/lib/db/models/Subject";
import { Class } from "@/lib/db/models/Class";
import { Exam } from "@/lib/db/models/Exam";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { SubjectInput } from "@/lib/validations/subject";

export async function listSubjects(params: { classId?: string; search?: string }) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.classId) filter.class = params.classId;
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { code: { $regex: params.search, $options: "i" } },
    ];
  }

  return Subject.find(filter)
    .populate("class", "name")
    .populate("teacher", "name")
    .sort({ name: 1 })
    .lean();
}

export async function getSubjectById(id: string) {
  await connectToDatabase();

  const subject = await Subject.findById(id).populate("class", "name").populate("teacher", "name").lean();
  if (!subject) {
    throw new NotFoundError("Subject not found.");
  }
  return subject;
}

async function assertClassExists(classId: string) {
  const exists = await Class.exists({ _id: classId });
  if (!exists) {
    throw new ConflictError("The selected class does not exist.");
  }
}

export async function createSubject(input: SubjectInput) {
  await connectToDatabase();
  await assertClassExists(input.class);

  const duplicate = await Subject.findOne({ code: input.code.toUpperCase(), class: input.class });
  if (duplicate) {
    throw new ConflictError("A subject with this code already exists for this class.");
  }

  return Subject.create(input);
}

export async function updateSubject(id: string, input: SubjectInput) {
  await connectToDatabase();
  await assertClassExists(input.class);

  const duplicate = await Subject.findOne({
    code: input.code.toUpperCase(),
    class: input.class,
    _id: { $ne: id },
  });
  if (duplicate) {
    throw new ConflictError("A subject with this code already exists for this class.");
  }

  const updated = await Subject.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Subject not found.");
  }
  return updated;
}

export async function deleteSubject(id: string) {
  await connectToDatabase();

  const examCount = await Exam.countDocuments({ subject: id });
  if (examCount > 0) {
    throw new ConflictError("This subject has exams linked to it and cannot be deleted.");
  }

  const deleted = await Subject.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Subject not found.");
  }
}
