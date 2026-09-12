import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import {
  getStudentOverviewReport,
  getAttendanceReport,
  getFeesReportData,
  getAdmissionsReport,
  getResultsReport,
} from "@/lib/services/report.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listSubjects } from "@/lib/services/subject.service";
import { serialize } from "@/lib/serialize";
import { ReportsPageClient } from "@/components/reports/reports-page-client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    notFound();
  }

  const params = await searchParams;
  const classId = params.classId ?? "";
  const subjectId = params.subjectId ?? "";
  const from = params.from ? new Date(params.from) : undefined;
  const to = params.to ? new Date(params.to) : undefined;

  const [studentOverview, attendance, fees, admissions, results, classes, subjects] = await Promise.all([
    getStudentOverviewReport(),
    getAttendanceReport({ from, to, classId: classId || undefined }),
    getFeesReportData(),
    getAdmissionsReport(),
    getResultsReport({ classId: classId || undefined, subjectId: subjectId || undefined }),
    listClassesWithCounts(),
    listSubjects({}),
  ]);

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="School-wide insights derived from live data." />
      <ReportsPageClient
        studentOverview={serialize(studentOverview)}
        attendance={serialize(attendance)}
        fees={serialize(fees)}
        admissions={serialize(admissions)}
        results={serialize(results)}
        classes={serialize(classes)}
        subjects={serialize(subjects)}
        filters={{ classId, subjectId, from: params.from ?? "", to: params.to ?? "" }}
      />
    </div>
  );
}
