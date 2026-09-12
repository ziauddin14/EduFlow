"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/reports/kpi-card";
import { SimpleBarChart } from "@/components/reports/simple-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import type { AttendanceReport } from "@/lib/types/reports";
import type { ClassListItem } from "@/lib/types/academics";

export function AttendanceReportTab({
  data,
  classes,
  filters,
}: {
  data: AttendanceReport;
  classes: ClassListItem[];
  filters: { classId: string; from: string; to: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Class</p>
            <Select value={filters.classId || "all"} onValueChange={(v) => updateParams({ classId: v === "all" ? "" : v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">From</p>
            <Input type="date" value={filters.from} onChange={(e) => updateParams({ from: e.target.value })} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">To</p>
            <Input type="date" value={filters.to} onChange={(e) => updateParams({ to: e.target.value })} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Overall attendance"
          value={data.percentage !== null ? `${data.percentage}%` : "—"}
          icon={TrendingUp}
        />
        <KpiCard label="Present" value={data.present} icon={CalendarCheck} tone="success" />
        <KpiCard label="Late" value={data.late} tone="warning" />
        <KpiCard label="Absent" value={data.absent} tone="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance rate by class</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byClass.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No attendance records for this range" />
          ) : (
            <SimpleBarChart
              data={data.byClass.map((c) => ({ name: c.className, rate: c.percentage }))}
              categoryKey="name"
              series={[{ key: "rate", label: "Attendance %", color: "var(--chart-2)" }]}
              unit="%"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
