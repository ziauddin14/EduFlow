import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/reports/kpi-card";
import { SimpleBarChart } from "@/components/reports/simple-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import type { StudentOverviewReport } from "@/lib/types/reports";

export function StudentOverviewTab({ data }: { data: StudentOverviewReport }) {
  const active = data.byStatus.find((s) => s.status === "Active")?.count ?? 0;
  const inactive = data.byStatus.find((s) => s.status === "Inactive")?.count ?? 0;
  const graduated = data.byStatus.find((s) => s.status === "Graduated")?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total students" value={data.total} icon={Users} />
        <KpiCard label="Active" value={active} icon={UserCheck} tone="success" />
        <KpiCard label="Inactive" value={inactive} icon={UserX} tone="warning" />
        <KpiCard label="Graduated" value={graduated} icon={GraduationCap} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students by class</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byClass.every((c) => c.count === 0) ? (
            <EmptyState icon={Users} title="No students yet" />
          ) : (
            <SimpleBarChart
              data={data.byClass.map((c) => ({ name: c.className, count: c.count }))}
              categoryKey="name"
              series={[{ key: "count", label: "Students", color: "var(--chart-1)" }]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
