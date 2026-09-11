"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Pencil, CheckCircle2, XCircle, Eye, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdmissionFormDialog } from "@/components/admissions/admission-form-dialog";
import { EnrollDialog } from "@/components/admissions/enroll-dialog";
import type { AdmissionDetail } from "@/lib/types/admissions";
import type { ClassListItem } from "@/lib/types/academics";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  New: "outline",
  "Under Review": "secondary",
  Approved: "default",
  Rejected: "destructive",
};

export function AdmissionDetailView({
  data,
  classes,
}: {
  data: { admission: AdmissionDetail; student: { _id: string; name: string; studentId: string } | null };
  classes: ClassListItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const { admission, student } = data;
  const locked = admission.status === "Approved";

  async function changeStatus(status: "Under Review" | "Rejected") {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admissions/${admission._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update status.");
        return;
      }
      toast.success(`Marked as ${status}.`);
      router.refresh();
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{admission.applicantName}</h2>
              <Badge variant={STATUS_VARIANT[admission.status]}>{admission.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Applied {format(new Date(admission.applicationDate), "MMM d, yyyy")} for{" "}
              {admission.desiredClass?.name ?? "an unspecified class"}
            </p>
          </div>
          {canManage && !locked && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {admission.status !== "Under Review" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={statusLoading}
                  onClick={() => changeStatus("Under Review")}
                >
                  Mark under review
                </Button>
              )}
              {admission.status !== "Rejected" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={statusLoading}
                  onClick={() => changeStatus("Rejected")}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              )}
              <Button size="sm" onClick={() => setEnrollOpen(true)}>
                <CheckCircle2 className="h-4 w-4" />
                Approve &amp; enroll
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {locked && student && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Enrolled as a student</p>
                <p className="text-sm text-muted-foreground">
                  {student.name} &middot; {student.studentId}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/students/${student._id}`}>
                <Eye className="h-4 w-4" />
                View profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applicant details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guardian</span>
              <span>{admission.guardianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span>{admission.contact}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desired class</span>
              <span>{admission.desiredClass?.name ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {admission.notes || "No notes recorded."}
          </CardContent>
        </Card>
      </div>

      <AdmissionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        admission={admission}
        classes={classes}
        onSaved={() => router.refresh()}
      />

      <EnrollDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        admission={admission}
        onEnrolled={() => router.refresh()}
      />
    </div>
  );
}
