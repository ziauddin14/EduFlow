import { connectToDatabase } from "@/lib/db/mongodb";
import { Student } from "@/lib/db/models/Student";
import { Class } from "@/lib/db/models/Class";
import { Attendance } from "@/lib/db/models/Attendance";
import { Fee } from "@/lib/db/models/Fee";
import { Admission } from "@/lib/db/models/Admission";
import { Result } from "@/lib/db/models/Result";
import { STUDENT_STATUSES } from "@/types";

export async function getStudentOverviewReport() {
  await connectToDatabase();

  const [classes, students] = await Promise.all([
    Class.find().select("name").sort({ name: 1 }).lean(),
    Student.find().select("class section status").lean(),
  ]);

  const byClass = classes.map((cls) => ({
    className: cls.name,
    count: students.filter((s) => s.class.toString() === cls._id.toString()).length,
  }));

  const byStatus = STUDENT_STATUSES.map((status) => ({
    status,
    count: students.filter((s) => s.status === status).length,
  }));

  return {
    total: students.length,
    byClass,
    byStatus,
  };
}

export async function getAttendanceReport(params: { from?: Date; to?: Date; classId?: string }) {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.classId) filter.class = params.classId;
  if (params.from || params.to) {
    filter.date = {};
    if (params.from) (filter.date as Record<string, Date>).$gte = params.from;
    if (params.to) (filter.date as Record<string, Date>).$lte = params.to;
  }

  const records = await Attendance.find(filter).populate("class", "name").lean();

  let present = 0;
  let absent = 0;
  let late = 0;

  const byClassMap = new Map<string, { className: string; present: number; absent: number; late: number; total: number }>();

  for (const record of records) {
    const className = (record.class as { name: string })?.name ?? "Unknown";
    const key = `${className}-${record.section}`;
    const entry = byClassMap.get(key) ?? { className: `${className} ${record.section}`, present: 0, absent: 0, late: 0, total: 0 };

    for (const r of record.records) {
      entry.total += 1;
      if (r.status === "Present") {
        present += 1;
        entry.present += 1;
      } else if (r.status === "Absent") {
        absent += 1;
        entry.absent += 1;
      } else {
        late += 1;
        entry.late += 1;
      }
    }

    byClassMap.set(key, entry);
  }

  const total = present + absent + late;

  return {
    present,
    absent,
    late,
    total,
    percentage: total > 0 ? Math.round(((present + late) / total) * 100) : null,
    byClass: Array.from(byClassMap.values()).map((c) => ({
      ...c,
      percentage: c.total > 0 ? Math.round(((c.present + c.late) / c.total) * 100) : 0,
    })),
  };
}

export async function getFeesReportData() {
  await connectToDatabase();

  const fees = await Fee.find()
    .populate({ path: "student", select: "class", populate: { path: "class", select: "name" } })
    .select("totalAmount paidAmount status student")
    .lean();

  const totalAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
  const collectedAmount = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingAmount = totalAmount - collectedAmount;

  const byClassMap = new Map<string, { className: string; total: number; collected: number }>();
  for (const fee of fees) {
    const className = (fee.student as { class?: { name: string } } | null)?.class?.name ?? "Unassigned";
    const entry = byClassMap.get(className) ?? { className, total: 0, collected: 0 };
    entry.total += fee.totalAmount;
    entry.collected += fee.paidAmount;
    byClassMap.set(className, entry);
  }

  const statusCounts = ["Paid", "Partial", "Pending", "Overdue"].map((status) => ({
    status,
    count: fees.filter((f) => f.status === status).length,
  }));

  return {
    totalAmount,
    collectedAmount,
    pendingAmount,
    collectedPercentage: totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0,
    byClass: Array.from(byClassMap.values()),
    statusCounts,
  };
}

export async function getAdmissionsReport() {
  await connectToDatabase();

  const admissions = await Admission.find().select("status").lean();
  const statuses = ["New", "Under Review", "Approved", "Rejected"] as const;

  const byStatus = statuses.map((status) => ({
    status,
    count: admissions.filter((a) => a.status === status).length,
  }));

  const approved = byStatus.find((s) => s.status === "Approved")?.count ?? 0;

  return {
    total: admissions.length,
    byStatus,
    conversionRate: admissions.length > 0 ? Math.round((approved / admissions.length) * 100) : 0,
  };
}

export async function getResultsReport(params: { classId?: string; subjectId?: string }) {
  await connectToDatabase();

  const examFilter: Record<string, unknown> = {};
  if (params.classId) examFilter.class = params.classId;
  if (params.subjectId) examFilter.subject = params.subjectId;

  const results = await Result.find()
    .populate({
      path: "exam",
      select: "class subject name",
      populate: [
        { path: "class", select: "name" },
        { path: "subject", select: "name" },
      ],
    })
    .select("percentage status exam")
    .lean();

  const filtered = results.filter((r) => {
    const exam = r.exam as { class?: { _id: string }; subject?: { _id: string } } | null;
    if (params.classId && exam?.class?._id?.toString() !== params.classId) return false;
    if (params.subjectId && exam?.subject?._id?.toString() !== params.subjectId) return false;
    return true;
  });

  const averagePercentage =
    filtered.length > 0 ? Math.round((filtered.reduce((sum, r) => sum + r.percentage, 0) / filtered.length) * 100) / 100 : 0;
  const passCount = filtered.filter((r) => r.status === "Pass").length;
  const failCount = filtered.filter((r) => r.status === "Fail").length;

  const byClassMap = new Map<string, { className: string; total: number; sum: number }>();
  const bySubjectMap = new Map<string, { subjectName: string; total: number; sum: number }>();

  for (const r of filtered) {
    const exam = r.exam as { class?: { name: string }; subject?: { name: string } } | null;
    const className = exam?.class?.name ?? "Unknown";
    const subjectName = exam?.subject?.name ?? "Unknown";

    const classEntry = byClassMap.get(className) ?? { className, total: 0, sum: 0 };
    classEntry.total += 1;
    classEntry.sum += r.percentage;
    byClassMap.set(className, classEntry);

    const subjectEntry = bySubjectMap.get(subjectName) ?? { subjectName, total: 0, sum: 0 };
    subjectEntry.total += 1;
    subjectEntry.sum += r.percentage;
    bySubjectMap.set(subjectName, subjectEntry);
  }

  return {
    totalResults: filtered.length,
    averagePercentage,
    passCount,
    failCount,
    passRate: filtered.length > 0 ? Math.round((passCount / filtered.length) * 100) : 0,
    byClass: Array.from(byClassMap.values()).map((c) => ({
      className: c.className,
      averagePercentage: Math.round((c.sum / c.total) * 100) / 100,
    })),
    bySubject: Array.from(bySubjectMap.values()).map((s) => ({
      subjectName: s.subjectName,
      averagePercentage: Math.round((s.sum / s.total) * 100) / 100,
    })),
  };
}
