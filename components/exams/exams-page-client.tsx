"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExamFormDialog } from "@/components/exams/exam-form-dialog";
import type { ExamListItem } from "@/lib/types/exams";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

export function ExamsPageClient({
  exams,
  classes,
  subjects,
}: {
  exams: ExamListItem[];
  classes: ClassListItem[];
  subjects: SubjectListItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamListItem | null>(null);
  const [deleting, setDeleting] = useState<ExamListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/exams/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete exam.");
        return;
      }
      toast.success("Exam deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-muted-foreground">{exams.length} exams</p>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create exam
          </Button>
        )}
      </div>

      {exams.length === 0 ? (
        <EmptyState icon={FileText} title="No exams scheduled" description="Create your first exam to get started." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Results</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam._id}>
                <TableCell className="font-medium">{exam.name}</TableCell>
                <TableCell>{exam.type}</TableCell>
                <TableCell>{exam.class?.name ?? "—"}</TableCell>
                <TableCell>{exam.subject?.name ?? "—"}</TableCell>
                <TableCell>{format(new Date(exam.date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {exam.maxMarks} <span className="text-muted-foreground">(pass {exam.passingMarks})</span>
                </TableCell>
                <TableCell>
                  <Badge variant={exam.resultCount > 0 ? "default" : "secondary"}>{exam.resultCount} entered</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild title="Enter/view results">
                    <Link href={`/exams/${exam._id}`}>
                      <ClipboardEdit className="h-4 w-4" />
                    </Link>
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(exam);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(exam)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ExamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        exam={editing}
        classes={classes}
        subjects={subjects}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete exam"
        description={`Delete "${deleting?.name}"? Exams with recorded results can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
