import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/reports/kpi-card";
import { SimpleBarChart } from "@/components/reports/simple-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import type { FeesReport } from "@/lib/types/reports";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Paid: "default",
  Partial: "secondary",
  Pending: "outline",
  Overdue: "destructive",
};

export function FeesReportTab({ data }: { data: FeesReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total fees" value={`$${data.totalAmount.toLocaleString()}`} icon={Wallet} />
        <KpiCard
          label="Collected"
          value={`$${data.collectedAmount.toLocaleString()}`}
          sublabel={`${data.collectedPercentage}% of total`}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard label="Pending" value={`$${data.pendingAmount.toLocaleString()}`} tone="warning" />
        <KpiCard
          label="Overdue records"
          value={data.statusCounts.find((s) => s.status === "Overdue")?.count ?? 0}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Total vs. collected by class</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byClass.length === 0 ? (
              <EmptyState icon={Wallet} title="No fee records yet" />
            ) : (
              <SimpleBarChart
                data={data.byClass.map((c) => ({ name: c.className, total: c.total, collected: c.collected }))}
                categoryKey="name"
                series={[
                  { key: "total", label: "Total", color: "var(--chart-1)" },
                  { key: "collected", label: "Collected", color: "var(--chart-2)" },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.statusCounts.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
