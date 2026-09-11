import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";
import { serialize } from "@/lib/serialize";
import { AttendancePageClient } from "@/components/attendance/attendance-page-client";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  const allClasses = await listClassesWithCounts();

  let classes = allClasses;
  if (session?.user.role === "TEACHER") {
    const allowedIds = new Set(await getTeacherClassIds(session.user.id));
    classes = allClasses.filter((c) => allowedIds.has(c._id.toString()));
  }

  return (
    <div>
      <PageHeader title="Attendance" description="Mark and review daily attendance by class and section." />
      <AttendancePageClient classes={serialize(classes)} />
    </div>
  );
}
