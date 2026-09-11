import { PageHeader } from "@/components/shared/page-header";
import { listTeachers } from "@/lib/services/teacher.service";
import { listStaff } from "@/lib/services/staff.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listSubjects } from "@/lib/services/subject.service";
import { serialize } from "@/lib/serialize";
import { TeachersStaffTabs } from "@/components/teachers/teachers-staff-tabs";

export default async function TeachersPage() {
  const [teachers, staff, classes, subjects] = await Promise.all([
    listTeachers(),
    listStaff(),
    listClassesWithCounts(),
    listSubjects({}),
  ]);

  return (
    <div>
      <PageHeader title="Teachers & Staff" description="Manage the teaching and operational staff directory." />
      <TeachersStaffTabs
        initialTeachers={serialize(teachers)}
        initialStaff={serialize(staff)}
        classes={serialize(classes)}
        subjects={serialize(subjects)}
      />
    </div>
  );
}
