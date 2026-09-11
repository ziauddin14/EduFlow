"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import type { AttendanceRosterEntry, AttendanceStatus } from "@/lib/types/attendance";

interface PopulatedAttendanceRecord {
  _id: string;
  date: string;
  class: { name: string };
  section: string;
  records: { student: { _id: string; name: string; studentId: string }; status: AttendanceStatus }[];
}

export function HistoryEditDialog({
  open,
  onOpenChange,
  attendanceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<PopulatedAttendanceRecord | null>(null);
  const [roster, setRoster] = useState<AttendanceRosterEntry[]>([]);

  useEffect(() => {
    if (!open || !attendanceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/attendance/${attendanceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          toast.error(json.error ?? "Could not load attendance record.");
          return;
        }
        setRecord(json.data);
        setRoster(
          json.data.records.map((r: PopulatedAttendanceRecord["records"][number]) => ({
            student: r.student,
            status: r.status,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [open, attendanceId]);

  function handleChange(studentId: string, status: AttendanceStatus) {
    setRoster((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, status } : r)));
  }

  async function handleSave() {
    if (!attendanceId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/attendance/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: roster.map((r) => ({ student: r.student._id, status: r.status })) }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update attendance.");
        return;
      }
      toast.success("Attendance updated.");
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit attendance</DialogTitle>
          <DialogDescription>
            {record && `${record.class.name} ${record.section} — ${format(new Date(record.date), "MMM d, yyyy")}`}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="rounded-lg border">
            <AttendanceGrid roster={roster} onChange={handleChange} />
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
