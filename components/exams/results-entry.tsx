"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { computeGrade, computePercentage } from "@/lib/services/grading";
import type { ExamResultsResponse } from "@/lib/types/exams";

export function ResultsEntry({ data }: { data: ExamResultsResponse }) {
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "TEACHER";

  const [marks, setMarks] = useState<Record<string, string>>(
    Object.fromEntries(data.entries.map((e) => [e.student._id, e.obtainedMarks?.toString() ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    return data.entries.map((entry) => {
      const raw = marks[entry.student._id];
      const value = raw === "" || raw === undefined ? null : Number(raw);
      const valid = value !== null && !Number.isNaN(value) && value >= 0 && value <= data.exam.maxMarks;
      const percentage = valid ? computePercentage(value!, data.exam.maxMarks) : null;
      const grade = percentage !== null ? computeGrade(percentage) : null;
      const status = valid ? (value! >= data.exam.passingMarks ? "Pass" : "Fail") : null;
      return { ...entry, value, valid: raw === "" || raw === undefined || valid, percentage, grade, status };
    });
  }, [marks, data]);

  async function handleSave() {
    const entries = data.entries
      .map((e) => ({ student: e.student._id, obtainedMarks: marks[e.student._id] }))
      .filter((e) => e.obtainedMarks !== "" && e.obtainedMarks !== undefined);

    if (entries.length === 0) {
      toast.error("Enter at least one mark before saving.");
      return;
    }

    const invalid = entries.some((e) => {
      const n = Number(e.obtainedMarks);
      return Number.isNaN(n) || n < 0 || n > data.exam.maxMarks;
    });
    if (invalid) {
      toast.error(`Marks must be between 0 and ${data.exam.maxMarks}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: data.exam._id,
          entries: entries.map((e) => ({ student: e.student, obtainedMarks: Number(e.obtainedMarks) })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not save results.");
        return;
      }
      toast.success("Results saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (data.entries.length === 0) {
    return <EmptyState icon={Users} title="No students in this class" />;
  }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="w-32">Marks (/{data.exam.maxMarks})</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((entry) => (
            <TableRow key={entry.student._id}>
              <TableCell className="font-medium">{entry.student.name}</TableCell>
              <TableCell className="text-muted-foreground">{entry.student.studentId}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  max={data.exam.maxMarks}
                  disabled={!canEdit}
                  value={marks[entry.student._id] ?? ""}
                  onChange={(e) => setMarks((prev) => ({ ...prev, [entry.student._id]: e.target.value }))}
                  className={!entry.valid ? "border-destructive" : ""}
                />
              </TableCell>
              <TableCell>{entry.percentage !== null ? `${entry.percentage}%` : "—"}</TableCell>
              <TableCell>{entry.grade ?? "—"}</TableCell>
              <TableCell>
                {entry.status ? (
                  <Badge variant={entry.status === "Pass" ? "default" : "destructive"}>{entry.status}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canEdit && (
        <div className="flex justify-end border-t p-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save results"}
          </Button>
        </div>
      )}
    </div>
  );
}
