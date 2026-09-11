"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { HistoryEditDialog } from "@/components/attendance/history-edit-dialog";
import type { ClassListItem } from "@/lib/types/academics";
import type { AttendanceHistoryItem } from "@/lib/types/attendance";

export function HistoryTab({ classes }: { classes: ClassListItem[] }) {
  const [classId, setClassId] = useState(classes[0]?._id ?? "");
  const [section, setSection] = useState(classes[0]?.sections[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  useEffect(() => {
    if (selectedClass && !sections.includes(section)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSection(sections[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  function load() {
    if (!classId || !section) return;
    setLoading(true);
    fetch(`/api/attendance?classId=${classId}&section=${encodeURIComponent(section)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          toast.error(json.error ?? "Could not load history.");
          return;
        }
        setHistory(json.data.history);
      })
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [classId, section]);

  if (classes.length === 0) {
    return <EmptyState icon={History} title="No classes assigned" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Class</p>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Section</p>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : history.length === 0 ? (
          <EmptyState icon={History} title="No attendance history yet" description="Recorded days will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((day) => {
                const present = day.records.filter((r) => r.status === "Present").length;
                const late = day.records.filter((r) => r.status === "Late").length;
                const absent = day.records.filter((r) => r.status === "Absent").length;
                const total = day.records.length;
                const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
                return (
                  <TableRow key={day._id}>
                    <TableCell className="font-medium">{format(new Date(day.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{present}</TableCell>
                    <TableCell>{late}</TableCell>
                    <TableCell>{absent}</TableCell>
                    <TableCell>
                      <Badge variant={rate >= 90 ? "default" : rate >= 75 ? "secondary" : "destructive"}>
                        {rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(day._id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <HistoryEditDialog
        open={Boolean(editingId)}
        onOpenChange={(open) => !open && setEditingId(null)}
        attendanceId={editingId}
        onSaved={load}
      />
    </div>
  );
}
