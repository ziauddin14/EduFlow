import { PageHeader } from "@/components/shared/page-header";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listSubjects } from "@/lib/services/subject.service";
import { listTeachersForSelect } from "@/lib/services/teacher.service";
import { AcademicsTabs } from "@/components/academics/academics-tabs";
import { serialize } from "@/lib/serialize";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function AcademicsPage() {
  const [classes, subjects, teachers] = await Promise.all([
    listClassesWithCounts(),
    listSubjects({}),
    listTeachersForSelect(),
  ]);

  return (
    <div>
      <PageHeader title="Classes & Subjects" description="Academic structure: classes, sections, and subjects." />
      <AcademicsTabs
        initialClasses={serialize(classes)}
        initialSubjects={serialize(subjects)}
        teachers={serialize(teachers)}
      />
    </div>
  );
}
