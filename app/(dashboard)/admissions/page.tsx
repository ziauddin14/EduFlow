import { PageHeader } from "@/components/shared/page-header";
import { listAdmissions } from "@/lib/services/admission.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { serialize } from "@/lib/serialize";
import { AdmissionsPageClient } from "@/components/admissions/admissions-page-client";
import type { AdmissionListItem } from "@/lib/types/admissions";
import type { PaginatedResult } from "@/lib/validations/common";

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.search ?? "";
  const status = params.status ?? "";

  const [result, classes] = await Promise.all([
    listAdmissions({ page, pageSize: 20, search, status }),
    listClassesWithCounts(),
  ]);

  return (
    <div>
      <PageHeader title="Admissions" description="Track applicants from inquiry to enrollment." />
      <AdmissionsPageClient
        result={serialize(result) as PaginatedResult<AdmissionListItem>}
        classes={serialize(classes)}
        filters={{ search, status }}
      />
    </div>
  );
}
