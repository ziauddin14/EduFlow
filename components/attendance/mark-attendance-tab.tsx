"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import type { ClassListItem } from "@/lib/types/academics";
import type { AttendanceForDateResponse, AttendanceRosterEntry, AttendanceStatus } from "@/lib/types/attendance";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function MarkAttendanceTab({ classes }: { classes: ClassListItem[] }) {
  const [classId, setClassId] = useState(classes[0]?._id ?? "");
  const [section, setSection] = useState(classes[0]?.sections[0] ?? "");
  const [date, setDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AttendanceForDateResponse | null>(null);
  const [roster, setRoster] = useState<AttendanceRosterEntry[]>([]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  useEffect(() => {
    if (selectedClass && !sections.includes(section)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSection(sections[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!classId || !section || !date) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/attendance?classId=${classId}&section=${encodeURIComponent(section)}&date=${date}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          toast.error(json.error ?? "Could not load attendance.");
          return;
        }
        setData(json.data);
        setRoster(json.data.roster);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId, section, date]);

  const counts = useMemo(() => {
    const present = roster.filter((r) => r.status === "Present").length;
    const late = roster.filter((r) => r.status === "Late").length;
    const absent = roster.filter((r) => r.status === "Absent").length;
    const unmarked = roster.filter((r) => r.status === null).length;
    return { present, late, absent, unmarked };
  }, [roster]);

  function handleChange(studentId: string, status: AttendanceStatus) {
    setRoster((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, status } : r)));
  }

  async function handleSave() {
    if (roster.some((r) => r.status === null)) {
      toast.error("Mark every student before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class: classId,
          section,
          date,
          records: roster.map((r) => ({ student: r.student._id, status: r.status })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not save attendance.");
        return;
      }
      toast.success("Attendance saved.");
    } finally {
      setSaving(false);
    }
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No classes assigned"
        description="You don't have any classes to mark attendance for yet."
      />
    );
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
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Date</p>
            <Input type="date" value={date} max={todayInputValue()} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <div className="ml-auto flex gap-4 text-sm">
            <span className="text-success">{counts.present} present</span>
            <span className="text-warning">{counts.late} late</span>
            <span className="text-destructive">{counts.absent} absent</span>
            {data && data.classPercentage.percentage !== null && (
              <span className="text-muted-foreground">
                Class avg: {data.classPercentage.percentage}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading roster…</div>
        ) : roster.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No students in this section" />
        ) : (
          <>
            <AttendanceGrid roster={roster} onChange={handleChange} />
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                {data?.alreadyMarked ? "Attendance already recorded for this day — saving will update it." : "Not yet recorded for this day."}
              </p>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save attendance"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
