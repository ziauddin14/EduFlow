import { connectToDatabase } from "@/lib/db/mongodb";
import { Exam } from "@/lib/db/models/Exam";
import { Class } from "@/lib/db/models/Class";
import { Subject } from "@/lib/db/models/Subject";
import { Result } from "@/lib/db/models/Result";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { ExamInput } from "@/lib/validations/exam";

export async function listExams(params: { classId?: string; subjectId?: string; search?: string }) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.classId) filter.class = params.classId;
  if (params.subjectId) filter.subject = params.subjectId;
  if (params.search) filter.name = { $regex: params.search, $options: "i" };

  const exams = await Exam.find(filter)
    .populate("class", "name")
    .populate("subject", "name code")
    .sort({ date: -1 })
    .lean();

  const withCounts = await Promise.all(
    exams.map(async (exam) => {
      const resultCount = await Result.countDocuments({ exam: exam._id });
      return { ...exam, resultCount };
    })
  );

  return withCounts;
}

export async function getUpcomingExams(limit = 5) {
  await connectToDatabase();

  return Exam.find({ date: { $gte: new Date() } })
    .populate("class", "name")
    .populate("subject", "name")
    .sort({ date: 1 })
    .limit(limit)
    .lean();
}

export async function getExamById(id: string) {
  await connectToDatabase();

  const exam = await Exam.findById(id).populate("class", "name sections").populate("subject", "name code").lean();
  if (!exam) {
    throw new NotFoundError("Exam not found.");
  }
  return exam;
}

async function assertClassAndSubjectValid(classId: string, subjectId: string) {
  const [classExists, subject] = await Promise.all([Class.exists({ _id: classId }), Subject.findById(subjectId)]);
  if (!classExists) {
    throw new ConflictError("The selected class does not exist.");
  }
  if (!subject) {
    throw new ConflictError("The selected subject does not exist.");
  }
  if (subject.class.toString() !== classId) {
    throw new ConflictError("The selected subject does not belong to the selected class.");
  }
}

export async function createExam(input: ExamInput) {
  await connectToDatabase();
  await assertClassAndSubjectValid(input.class, input.subject);

  return Exam.create(input);
}

export async function updateExam(id: string, input: ExamInput) {
  await connectToDatabase();
  await assertClassAndSubjectValid(input.class, input.subject);

  const updated = await Exam.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Exam not found.");
  }
  return updated;
}

export async function deleteExam(id: string) {
  await connectToDatabase();

  const resultCount = await Result.countDocuments({ exam: id });
  if (resultCount > 0) {
    throw new ConflictError("This exam has results recorded and cannot be deleted.");
  }

  const deleted = await Exam.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Exam not found.");
  }
}
