import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Exam } from "@/lib/db/models/Exam";
import { Student } from "@/lib/db/models/Student";
import { Result } from "@/lib/db/models/Result";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import { computeGrade, computePercentage, computePassFail } from "@/lib/services/grading";
import type { ResultsBulkInput } from "@/lib/validations/result";

export async function getResultsForExam(examId: string) {
  await connectToDatabase();

  const exam = await Exam.findById(examId).populate("class", "name").populate("subject", "name").lean();
  if (!exam) {
    throw new NotFoundError("Exam not found.");
  }

  const classId = (exam.class as { _id: Types.ObjectId })._id;

  const [roster, results] = await Promise.all([
    Student.find({ class: classId, status: "Active" }).select("name studentId").sort({ name: 1 }).lean(),
    Result.find({ exam: examId }).lean(),
  ]);

  const resultByStudent = new Map(results.map((r) => [r.student.toString(), r]));

  const entries = roster.map((student) => {
    const existing = resultByStudent.get(student._id.toString());
    return {
      student: { _id: student._id.toString(), name: student.name, studentId: student.studentId },
      resultId: existing?._id.toString() ?? null,
      obtainedMarks: existing?.obtainedMarks ?? null,
      percentage: existing?.percentage ?? null,
      grade: existing?.grade ?? null,
      status: existing?.status ?? null,
    };
  });

  return { exam, entries };
}

export async function saveResultsForExam(input: ResultsBulkInput) {
  await connectToDatabase();

  const exam = await Exam.findById(input.exam);
  if (!exam) {
    throw new NotFoundError("Exam not found.");
  }

  const validStudentIds = new Set(
    (await Student.find({ class: exam.class }).select("_id").lean()).map((s) => s._id.toString())
  );

  for (const entry of input.entries) {
    if (!validStudentIds.has(entry.student)) {
      throw new ConflictError("One or more students do not belong to this exam's class.");
    }
    if (entry.obtainedMarks > exam.maxMarks) {
      throw new ConflictError(`Obtained marks cannot exceed the exam's max marks of ${exam.maxMarks}.`);
    }
  }

  const saved = [];
  for (const entry of input.entries) {
    const percentage = computePercentage(entry.obtainedMarks, exam.maxMarks);
    const grade = computeGrade(percentage);
    const status = computePassFail(entry.obtainedMarks, exam.passingMarks);

    const result = await Result.findOneAndUpdate(
      { exam: input.exam, student: entry.student },
      { exam: input.exam, student: entry.student, obtainedMarks: entry.obtainedMarks, percentage, grade, status },
      { upsert: true, returnDocument: "after" }
    );
    saved.push(result);
  }

  return saved;
}

export async function getResultClassId(resultId: string): Promise<string | null> {
  await connectToDatabase();

  const result = await Result.findById(resultId).select("exam").lean();
  if (!result) return null;

  const exam = await Exam.findById(result.exam).select("class").lean();
  return exam ? exam.class.toString() : null;
}

export async function updateResult(id: string, obtainedMarks: number) {
  await connectToDatabase();

  const result = await Result.findById(id);
  if (!result) {
    throw new NotFoundError("Result not found.");
  }

  const exam = await Exam.findById(result.exam);
  if (!exam) {
    throw new NotFoundError("Associated exam not found.");
  }
  if (obtainedMarks > exam.maxMarks) {
    throw new ConflictError(`Obtained marks cannot exceed the exam's max marks of ${exam.maxMarks}.`);
  }

  const percentage = computePercentage(obtainedMarks, exam.maxMarks);
  result.obtainedMarks = obtainedMarks;
  result.percentage = percentage;
  result.grade = computeGrade(percentage);
  result.status = computePassFail(obtainedMarks, exam.passingMarks);
  await result.save();
  return result;
}
