"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { TeacherFormDialog } from "@/components/teachers/teacher-form-dialog";
import type { TeacherListItem } from "@/lib/types/teachers";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

export function TeachersTab({
  initialTeachers,
  classes,
  subjects,
}: {
  initialTeachers: TeacherListItem[];
  classes: ClassListItem[];
  subjects: SubjectListItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherListItem | null>(null);
  const [deleting, setDeleting] = useState<TeacherListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return initialTeachers;
    const q = search.toLowerCase();
    return initialTeachers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  }, [initialTeachers, search]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/teachers/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete teacher.");
        return;
      }
      toast.success("Teacher deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8"
          />
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add teacher
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No teachers found" description="Try adjusting your search." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((teacher) => (
              <TableRow key={teacher._id}>
                <TableCell>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.email}</p>
                </TableCell>
                <TableCell>{teacher.designation}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {teacher.classes.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      teacher.classes.map((c) => (
                        <Badge key={c._id} variant="secondary">
                          {c.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>{teacher.subjects.length}</TableCell>
                <TableCell>
                  <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                    {teacher.status}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(teacher);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(teacher)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        teacher={editing}
        classes={classes}
        subjects={subjects}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete teacher"
        description={`Delete "${deleting?.name}"? Teachers assigned to a class, subject, or timetable slot can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
