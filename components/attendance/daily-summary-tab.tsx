"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

interface ClassBreakdown {
  class: { name: string } | null;
  section: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

interface DailySummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number | null;
  byClass: ClassBreakdown[];
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function DailySummaryTab() {
  const [date, setDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/attendance/summary?date=${date}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          toast.error(json.error ?? "Could not load summary.");
          return;
        }
        setSummary(json.data);
      })
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-3 pt-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Date</p>
            <Input type="date" value={date} max={todayInputValue()} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          {summary && summary.total > 0 && (
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-lg font-semibold">{summary.percentage}%</p>
                <p className="text-muted-foreground">Overall</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-success">{summary.present}</p>
                <p className="text-muted-foreground">Present</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-warning">{summary.late}</p>
                <p className="text-muted-foreground">Late</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-destructive">{summary.absent}</p>
                <p className="text-muted-foreground">Absent</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !summary || summary.byClass.length === 0 ? (
          <EmptyState icon={BarChart3} title="No attendance recorded for this date" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.byClass.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {row.class?.name ?? "—"} {row.section}
                  </TableCell>
                  <TableCell>{row.present}</TableCell>
                  <TableCell>{row.late}</TableCell>
                  <TableCell>{row.absent}</TableCell>
                  <TableCell>
                    <Badge variant={row.percentage >= 90 ? "default" : row.percentage >= 75 ? "secondary" : "destructive"}>
                      {row.percentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
