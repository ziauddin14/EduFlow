"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Pencil, CalendarCheck, Wallet, FileText, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import type { ClassListItem } from "@/lib/types/academics";
import type { StudentDetailResponse } from "@/lib/types/students";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Active: "default",
  Inactive: "secondary",
  Graduated: "outline",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function StudentProfile({
  detail,
  classes,
}: {
  detail: StudentDetailResponse;
  classes: ClassListItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [editOpen, setEditOpen] = useState(false);

  const { student, attendanceSummary, feeSummary, resultSummary } = detail;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{student.name}</h2>
                <Badge variant={STATUS_VARIANT[student.status]}>{student.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {student.class?.name ?? "Unassigned"} {student.section} &middot; {student.gender} &middot; DOB{" "}
                {format(new Date(student.dob), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Guardian &amp; contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guardian</span>
              <span>{student.guardianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.guardianPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right">{student.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admission date</span>
              <span>{format(new Date(student.admissionDate), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              Attendance summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {attendanceSummary.totalDays === 0 ? (
              <p className="text-muted-foreground">No attendance records yet.</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Present</span>
                  <span>{attendanceSummary.present}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Late</span>
                  <span>{attendanceSummary.late}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Absent</span>
                  <span>{attendanceSummary.absent}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Attendance rate</span>
                  <span>{attendanceSummary.percentage}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Fee summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {feeSummary.recordCount === 0 ? (
              <p className="text-muted-foreground">No fee records yet.</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span>${feeSummary.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>${feeSummary.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Pending</span>
                  <span>${feeSummary.pendingAmount.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Result summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {resultSummary.length === 0 ? (
              <p className="text-muted-foreground">No results yet.</p>
            ) : (
              resultSummary.map((r) => (
                <div key={r._id} className="flex justify-between">
                  <span className="text-muted-foreground">{r.exam?.name ?? "Exam"}</span>
                  <span>
                    {r.percentage}% &middot; {r.grade}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={{ ...student, class: student.class ? { _id: student.class._id, name: student.class.name } : null }}
        classes={classes}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
