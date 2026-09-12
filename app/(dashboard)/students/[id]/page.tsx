import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getStudentDetail } from "@/lib/services/student.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { serialize } from "@/lib/serialize";
import { StudentProfile } from "@/components/students/student-profile";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  let detail;
  try {
    detail = await getStudentDetail(id);
  } catch {
    notFound();
  }

  if (session?.user.role === "TEACHER") {
    const allowedClassIds = await getTeacherClassIds(session.user.id);
    const classId = (detail.student.class as { _id: string } | null)?._id?.toString();
    if (!classId || !allowedClassIds.includes(classId)) {
      notFound();
    }
  }

  const classes = await listClassesWithCounts();

  return (
    <div>
      <PageHeader title={detail.student.name} description={`Student ID: ${detail.student.studentId}`} />
      <StudentProfile detail={serialize(detail)} classes={serialize(classes)} />
    </div>
  );
}
