import { PageHeader } from "@/components/shared/page-header";
import { listFees, getFeeSummary } from "@/lib/services/fee.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { listStudentsForSelect } from "@/lib/services/student.service";
import { serialize } from "@/lib/serialize";
import { FeesPageClient } from "@/components/fees/fees-page-client";
import type { FeeListItem, FeeSummary } from "@/lib/types/fees";
import type { PaginatedResult } from "@/lib/validations/common";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.search ?? "";
  const classId = params.classId ?? "";
  const status = params.status ?? "";
  const month = params.month ?? "";

  const [result, summary, classes, students] = await Promise.all([
    listFees({ page, pageSize: 20, search, classId, status, month }),
    getFeeSummary(),
    listClassesWithCounts(),
    listStudentsForSelect(),
  ]);

  return (
    <div>
      <PageHeader title="Fees" description="Track fee records, collection, and payment status." />
      <FeesPageClient
        result={serialize(result) as PaginatedResult<FeeListItem>}
        summary={serialize(summary) as FeeSummary}
        classes={serialize(classes)}
        students={serialize(students)}
        filters={{ search, classId, status, month }}
      />
    </div>
  );
}
