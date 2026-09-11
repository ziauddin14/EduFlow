import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Attendance } from "@/lib/db/models/Attendance";
import { Student } from "@/lib/db/models/Student";
import { Class } from "@/lib/db/models/Class";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { AttendanceStatus } from "@/types";
import type { AttendanceMarkInput, AttendanceUpdateInput } from "@/lib/validations/attendance";

interface AttendanceRecordDoc {
  student: Types.ObjectId;
  status: AttendanceStatus;
}

function toDayKey(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getAttendanceForDate(classId: string, section: string, date: Date) {
  await connectToDatabase();

  const day = toDayKey(date);

  const [roster, existing] = await Promise.all([
    Student.find({ class: classId, section, status: "Active" })
      .select("name studentId")
      .sort({ name: 1 })
      .lean(),
    Attendance.findOne({ class: classId, section, date: day }).lean(),
  ]);

  const statusByStudent = new Map(
    ((existing?.records ?? []) as AttendanceRecordDoc[]).map((r) => [r.student.toString(), r.status])
  );

  return {
    date: day,
    alreadyMarked: Boolean(existing),
    roster: roster.map((student) => ({
      student: { _id: student._id.toString(), name: student.name, studentId: student.studentId },
      status: statusByStudent.get(student._id.toString()) ?? null,
    })),
  };
}

export async function saveAttendance(input: AttendanceMarkInput, markedBy: string) {
  await connectToDatabase();

  const cls = await Class.findById(input.class).lean();
  if (!cls) {
    throw new ConflictError("The selected class does not exist.");
  }
  if (!cls.sections.includes(input.section)) {
    throw new ConflictError(`Section "${input.section}" does not exist on ${cls.name}.`);
  }

  const validStudentIds = new Set(
    (
      await Student.find({ class: input.class, section: input.section }).select("_id").lean()
    ).map((s) => s._id.toString())
  );
  const invalid = input.records.find((r) => !validStudentIds.has(r.student));
  if (invalid) {
    throw new ConflictError("One or more students do not belong to the selected class and section.");
  }

  const day = toDayKey(input.date);

  return Attendance.findOneAndUpdate(
    { class: input.class, section: input.section, date: day },
    { class: input.class, section: input.section, date: day, records: input.records, markedBy },
    { upsert: true, returnDocument: "after" }
  );
}

export async function getAttendanceHistory(classId: string, section: string, limit = 30) {
  await connectToDatabase();

  return Attendance.find({ class: classId, section })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}

export async function updateAttendanceRecords(id: string, input: AttendanceUpdateInput, markedBy: string) {
  await connectToDatabase();

  const attendance = await Attendance.findById(id).lean();
  if (!attendance) {
    throw new NotFoundError("Attendance record not found.");
  }

  const validStudentIds = new Set(
    (
      await Student.find({ class: attendance.class, section: attendance.section }).select("_id").lean()
    ).map((s) => s._id.toString())
  );
  const invalid = input.records.find((r) => !validStudentIds.has(r.student));
  if (invalid) {
    throw new ConflictError("One or more students do not belong to this class and section.");
  }

  return Attendance.findByIdAndUpdate(
    id,
    { records: input.records, markedBy },
    { returnDocument: "after" }
  );
}

export async function getAttendanceRecordById(id: string) {
  await connectToDatabase();

  const record = await Attendance.findById(id)
    .populate("class", "name")
    .populate("records.student", "name studentId")
    .lean();
  if (!record) {
    throw new NotFoundError("Attendance record not found.");
  }
  return record;
}

export async function getDailySummary(date: Date) {
  await connectToDatabase();

  const day = toDayKey(date);
  const records = await Attendance.find({ date: day }).populate("class", "name").lean();

  let present = 0;
  let absent = 0;
  let late = 0;

  const byClass = records.map((r) => {
    const recs = r.records as AttendanceRecordDoc[];
    const classPresent = recs.filter((rec) => rec.status === "Present").length;
    const classLate = recs.filter((rec) => rec.status === "Late").length;
    const classAbsent = recs.filter((rec) => rec.status === "Absent").length;
    present += classPresent;
    late += classLate;
    absent += classAbsent;
    const total = recs.length;
    return {
      class: r.class,
      section: r.section,
      total,
      present: classPresent,
      late: classLate,
      absent: classAbsent,
      percentage: total > 0 ? Math.round(((classPresent + classLate) / total) * 100) : 0,
    };
  });

  const total = present + absent + late;

  return {
    date: day,
    total,
    present,
    absent,
    late,
    percentage: total > 0 ? Math.round(((present + late) / total) * 100) : null,
    byClass,
  };
}

export async function getClassAttendancePercentage(classId: string, section: string) {
  await connectToDatabase();

  const records = await Attendance.find({ class: classId, section }).select("records").lean();

  let present = 0;
  let total = 0;
  for (const r of records) {
    const recs = r.records as AttendanceRecordDoc[];
    total += recs.length;
    present += recs.filter((rec) => rec.status === "Present" || rec.status === "Late").length;
  }

  return {
    daysRecorded: records.length,
    percentage: total > 0 ? Math.round((present / total) * 100) : null,
  };
}
