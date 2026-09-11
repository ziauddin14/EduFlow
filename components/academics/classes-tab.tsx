"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
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
import { ClassFormDialog } from "@/components/academics/class-form-dialog";
import type { ClassListItem, TeacherOption } from "@/lib/types/academics";

export function ClassesTab({
  initialClasses,
  teachers,
}: {
  initialClasses: ClassListItem[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassListItem | null>(null);
  const [deleting, setDeleting] = useState<ClassListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(cls: ClassListItem) {
    setEditing(cls);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/classes/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete class.");
        return;
      }
      toast.success("Class deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-muted-foreground">{initialClasses.length} classes</p>
        {isAdmin && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add class
          </Button>
        )}
      </div>

      {initialClasses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="Create your first class to get started."
          action={
            isAdmin && (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Add class
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Class teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Teachers</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialClasses.map((cls) => (
              <TableRow key={cls._id}>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {cls.sections.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{cls.classTeacher?.name ?? "—"}</TableCell>
                <TableCell>{cls.studentCount}</TableCell>
                <TableCell>{cls.subjectCount}</TableCell>
                <TableCell>{cls.teacherCount}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(cls)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        classItem={editing}
        teachers={teachers}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete class"
        description={`Delete "${deleting?.name}"? This can't be undone. Classes with students, subjects, or timetable entries can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
