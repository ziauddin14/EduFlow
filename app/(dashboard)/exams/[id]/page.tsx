import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { getResultsForExam } from "@/lib/services/result.service";
import { getTeacherClassIds } from "@/lib/services/teacher.service";
import { serialize } from "@/lib/serialize";
import { ResultsEntry } from "@/components/exams/results-entry";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  let data;
  try {
    data = await getResultsForExam(id);
  } catch {
    notFound();
  }

  if (session?.user.role === "TEACHER") {
    const allowed = await getTeacherClassIds(session.user.id);
    const classId = data.exam.class?._id?.toString();
    if (!classId || !allowed.includes(classId)) {
      notFound();
    }
  }

  return (
    <div>
      <PageHeader
        title={data.exam.name}
        description={`${data.exam.class?.name ?? ""} · ${data.exam.subject?.name ?? ""} · Max marks ${data.exam.maxMarks}`}
      />
      <ResultsEntry data={serialize(data)} />
    </div>
  );
}
