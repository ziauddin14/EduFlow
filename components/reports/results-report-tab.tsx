"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileText, Percent, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ResultsReport } from "@/lib/types/reports";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

export function ResultsReportTab({
  data,
  classes,
  subjects,
  filters,
}: {
  data: ResultsReport;
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  filters: { classId: string; subjectId: string };
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
            <p className="text-sm font-medium">Subject</p>
            <Select value={filters.subjectId || "all"} onValueChange={(v) => updateParams({ subjectId: v === "all" ? "" : v })}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} ({s.class?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Results recorded" value={data.totalResults} icon={FileText} />
        <KpiCard label="Average percentage" value={`${data.averagePercentage}%`} icon={Percent} />
        <KpiCard label="Pass rate" value={`${data.passRate}%`} sublabel={`${data.passCount} pass / ${data.failCount} fail`} icon={Award} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average % by class</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byClass.length === 0 ? (
              <EmptyState icon={FileText} title="No results yet" />
            ) : (
              <SimpleBarChart
                data={data.byClass.map((c) => ({ name: c.className, avg: c.averagePercentage }))}
                categoryKey="name"
                series={[{ key: "avg", label: "Average %", color: "var(--chart-4)" }]}
                unit="%"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average % by subject</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bySubject.length === 0 ? (
              <EmptyState icon={FileText} title="No results yet" />
            ) : (
              <SimpleBarChart
                data={data.bySubject.map((s) => ({ name: s.subjectName, avg: s.averagePercentage }))}
                categoryKey="name"
                series={[{ key: "avg", label: "Average %", color: "var(--chart-5)" }]}
                unit="%"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
