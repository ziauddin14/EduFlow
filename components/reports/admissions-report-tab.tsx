import { ClipboardList, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/reports/kpi-card";
import { SimpleBarChart } from "@/components/reports/simple-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import type { AdmissionsReport } from "@/lib/types/reports";

export function AdmissionsReportTab({ data }: { data: AdmissionsReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total admissions" value={data.total} icon={ClipboardList} />
        <KpiCard
          label="Approved"
          value={data.byStatus.find((s) => s.status === "Approved")?.count ?? 0}
          tone="success"
        />
        <KpiCard
          label="Under review"
          value={data.byStatus.find((s) => s.status === "Under Review")?.count ?? 0}
          tone="warning"
        />
        <KpiCard
          label="Conversion rate"
          value={`${data.conversionRate}%`}
          sublabel="Approved / total"
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admissions by status</CardTitle>
        </CardHeader>
        <CardContent>
          {data.total === 0 ? (
            <EmptyState icon={ClipboardList} title="No admissions yet" />
          ) : (
            <SimpleBarChart
              data={data.byStatus.map((s) => ({ name: s.status, count: s.count }))}
              categoryKey="name"
              series={[{ key: "count", label: "Applicants", color: "var(--chart-3)" }]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
