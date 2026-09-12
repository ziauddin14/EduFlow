import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listStudents } from "@/lib/services/student.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";
import { serialize } from "@/lib/serialize";
import { StudentsPageClient } from "@/components/students/students-page-client";
import type { StudentListItem } from "@/lib/types/students";
import type { PaginatedResult } from "@/lib/validations/common";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const page = Number(params.page ?? "1") || 1;
  const search = params.search ?? "";
  const classId = params.classId ?? "";
  const status = params.status ?? "";

  const restrictToClassIds =
    session?.user.role === "TEACHER" ? await getTeacherClassIds(session.user.id) : undefined;

  const [result, classes] = await Promise.all([
    listStudents({ page, pageSize: 20, search, classId, status, restrictToClassIds }),
    listClassesWithCounts(),
  ]);

  return (
    <div>
      <PageHeader title="Students" description="Manage student records, search, and profiles." />
      <StudentsPageClient
        result={serialize(result) as PaginatedResult<StudentListItem>}
        classes={serialize(classes)}
        filters={{ search, classId, status }}
      />
    </div>
  );
}
