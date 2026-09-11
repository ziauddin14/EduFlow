import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Student } from "@/lib/db/models/Student";
import { Class } from "@/lib/db/models/Class";
import { Attendance } from "@/lib/db/models/Attendance";
import { Fee } from "@/lib/db/models/Fee";
import { Result } from "@/lib/db/models/Result";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { PaginatedResult } from "@/lib/validations/common";
import type { StudentInput } from "@/lib/validations/student";

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  classId?: string;
  status?: string;
  restrictToClassIds?: string[];
}

export async function listStudents(params: ListParams): Promise<PaginatedResult<unknown>> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;

  if (params.restrictToClassIds) {
    const allowed = params.classId
      ? params.restrictToClassIds.filter((id) => id === params.classId)
      : params.restrictToClassIds;
    filter.class = { $in: allowed };
  } else if (params.classId) {
    filter.class = params.classId;
  }
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { studentId: { $regex: params.search, $options: "i" } },
      { guardianName: { $regex: params.search, $options: "i" } },
    ];
  }

  const skip = (params.page - 1) * params.pageSize;

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate("class", "name")
      .sort({ name: 1 })
      .skip(skip)
      .limit(params.pageSize)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

async function assertValidClassAndSection(classId: string, section: string) {
  const cls = await Class.findById(classId).lean();
  if (!cls) {
    throw new ConflictError("The selected class does not exist.");
  }
  if (!cls.sections.includes(section)) {
    throw new ConflictError(`Section "${section}" does not exist on ${cls.name}.`);
  }
}

async function generateStudentId() {
  const count = await Student.countDocuments();
  return `STU${String(count + 1).padStart(5, "0")}`;
}

export async function createStudent(input: StudentInput) {
  await connectToDatabase();
  await assertValidClassAndSection(input.class, input.section);

  const studentId = await generateStudentId();
  return Student.create({ ...input, studentId });
}

export async function updateStudent(id: string, input: StudentInput) {
  await connectToDatabase();
  await assertValidClassAndSection(input.class, input.section);

  const updated = await Student.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Student not found.");
  }
  return updated;
}

export async function deleteStudent(id: string) {
  await connectToDatabase();

  const [attendanceCount, feeCount, resultCount] = await Promise.all([
    Attendance.countDocuments({ "records.student": id }),
    Fee.countDocuments({ student: id }),
    Result.countDocuments({ student: id }),
  ]);

  if (attendanceCount > 0 || feeCount > 0 || resultCount > 0) {
    throw new ConflictError(
      "This student has attendance, fee, or result records and cannot be deleted. Set status to Inactive instead."
    );
  }

  const deleted = await Student.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Student not found.");
  }
}

export async function getStudentDetail(id: string) {
  await connectToDatabase();

  const student = await Student.findById(id).populate("class", "name sections").lean();
  if (!student) {
    throw new NotFoundError("Student not found.");
  }

  const [attendanceRecords, feeRecords, resultRecords] = await Promise.all([
    Attendance.find({ "records.student": id }).select("date records").lean(),
    Fee.find({ student: id }).select("title totalAmount paidAmount status dueDate").sort({ dueDate: -1 }).lean(),
    Result.find({ student: id }).populate("exam", "name date").select("percentage grade status exam").lean(),
  ]);

  const attendanceForStudent = attendanceRecords.map((day) => {
    const records = day.records as { student: Types.ObjectId; status: string }[];
    const record = records.find((r) => r.student.toString() === id);
    return { date: day.date, status: record?.status };
  });
  const present = attendanceForStudent.filter((r) => r.status === "Present").length;
  const late = attendanceForStudent.filter((r) => r.status === "Late").length;
  const absent = attendanceForStudent.filter((r) => r.status === "Absent").length;
  const totalDays = attendanceForStudent.length;

  const feeTotal = feeRecords.reduce((sum, f) => sum + f.totalAmount, 0);
  const feePaid = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0);

  return {
    student,
    attendanceSummary: {
      totalDays,
      present,
      late,
      absent,
      percentage: totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : null,
    },
    feeSummary: {
      totalAmount: feeTotal,
      paidAmount: feePaid,
      pendingAmount: feeTotal - feePaid,
      recordCount: feeRecords.length,
    },
    resultSummary: resultRecords,
  };
}
