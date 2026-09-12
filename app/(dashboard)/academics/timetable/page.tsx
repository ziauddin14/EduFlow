import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listSubjects } from "@/lib/services/subject.service";
import { listTeachersForSelect, getTeacherClassIds } from "@/lib/services/teacher.service";
import { serialize } from "@/lib/serialize";
import { TimetablePageClient } from "@/components/timetable/timetable-page-client";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function TimetablePage() {
  const session = await getServerSession(authOptions);
  const allClasses = await listClassesWithCounts();

  let classes = allClasses;
  if (session?.user.role === "TEACHER") {
    const allowedIds = new Set(await getTeacherClassIds(session.user.id));
    classes = allClasses.filter((c) => allowedIds.has(c._id.toString()));
  }

  const [subjects, teachers] = await Promise.all([listSubjects({}), listTeachersForSelect()]);

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class and teacher schedules." />
      <TimetablePageClient classes={serialize(classes)} subjects={serialize(subjects)} teachers={serialize(teachers)} />
    </div>
  );
}
