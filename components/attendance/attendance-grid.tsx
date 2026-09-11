"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUSES } from "@/types";
import type { AttendanceRosterEntry, AttendanceStatus } from "@/lib/types/attendance";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  Present: "bg-success text-success-foreground hover:bg-success/90",
  Late: "bg-warning text-warning-foreground hover:bg-warning/90",
  Absent: "bg-destructive text-white hover:bg-destructive/90",
};

export function AttendanceGrid({
  roster,
  onChange,
  readOnly,
}: {
  roster: AttendanceRosterEntry[];
  onChange: (studentId: string, status: AttendanceStatus) => void;
  readOnly?: boolean;
}) {
  function markAll(status: AttendanceStatus) {
    for (const entry of roster) {
      onChange(entry.student._id, status);
    }
  }

  return (
    <div>
      {!readOnly && (
        <div className="flex gap-2 border-b p-3">
          <span className="self-center text-sm text-muted-foreground">Quick mark:</span>
          <Button size="sm" variant="outline" onClick={() => markAll("Present")}>
            All present
          </Button>
          <Button size="sm" variant="outline" onClick={() => markAll("Absent")}>
            All absent
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((entry) => (
            <TableRow key={entry.student._id}>
              <TableCell className="font-medium">{entry.student.name}</TableCell>
              <TableCell className="text-muted-foreground">{entry.student.studentId}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onChange(entry.student._id, status)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        entry.status === status
                          ? STATUS_STYLES[status]
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
