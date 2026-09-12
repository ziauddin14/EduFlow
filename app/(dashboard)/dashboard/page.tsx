import { PageHeader } from "@/components/shared/page-header";
import { countStudents } from "@/lib/services/student.service";
import { countActiveTeachers } from "@/lib/services/teacher.service";
import { getDailySummary } from "@/lib/services/attendance.service";
import { getFeeSummary } from "@/lib/services/fee.service";
import { countActiveAdmissions } from "@/lib/services/admission.service";
import { getUpcomingExams } from "@/lib/services/exam.service";
import { getRecentPublishedNotices } from "@/lib/services/notice.service";
import { serialize } from "@/lib/serialize";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [studentCount, teacherCount, todaysAttendance, feeSummary, activeAdmissions, upcomingExams, recentNotices] =
    await Promise.all([
      countStudents(),
      countActiveTeachers(),
      getDailySummary(new Date()),
      getFeeSummary(),
      countActiveAdmissions(),
      getUpcomingExams(5),
      getRecentPublishedNotices(5),
    ]);

  return (
    <div>
      <PageHeader title="Dashboard" description="School overview at a glance." />
      <DashboardClient
        studentCount={studentCount}
        teacherCount={teacherCount}
        todaysAttendance={serialize(todaysAttendance)}
        feeSummary={serialize(feeSummary)}
        activeAdmissions={activeAdmissions}
        upcomingExams={serialize(upcomingExams)}
        recentNotices={serialize(recentNotices)}
      />
    </div>
  );
}
