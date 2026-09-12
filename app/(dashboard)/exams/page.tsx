import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listExams } from "@/lib/services/exam.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listSubjects } from "@/lib/services/subject.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";
import { serialize } from "@/lib/serialize";
import { ExamsPageClient } from "@/components/exams/exams-page-client";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  const allClasses = await listClassesWithCounts();

  let classes = allClasses;
  let exams;

  if (session?.user.role === "TEACHER") {
    const allowedIds = new Set(await getTeacherClassIds(session.user.id));
    classes = allClasses.filter((c) => allowedIds.has(c._id.toString()));
    exams = (await Promise.all(classes.map((c) => listExams({ classId: c._id.toString() })))).flat();
  } else {
    exams = await listExams({});
  }

  const subjects = await listSubjects({});

  return (
    <div>
      <PageHeader title="Exams & Results" description="Schedule exams and manage student results." />
      <ExamsPageClient exams={serialize(exams)} classes={serialize(classes)} subjects={serialize(subjects)} />
    </div>
  );
}
