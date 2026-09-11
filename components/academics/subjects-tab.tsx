"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SubjectFormDialog } from "@/components/academics/subject-form-dialog";
import type { ClassListItem, SubjectListItem, TeacherOption } from "@/lib/types/academics";

export function SubjectsTab({
  initialSubjects,
  classes,
  teachers,
}: {
  initialSubjects: SubjectListItem[];
  classes: ClassListItem[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectListItem | null>(null);
  const [deleting, setDeleting] = useState<SubjectListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    return initialSubjects.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === "all" || s.class?._id === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [initialSubjects, search, classFilter]);

  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(subject: SubjectListItem) {
    setEditing(subject);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/subjects/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete subject.");
        return;
      }
      toast.success("Subject deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add subject
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No subjects found" description="Try adjusting your search or filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((subject) => (
              <TableRow key={subject._id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.class?.name ?? "—"}</TableCell>
                <TableCell>{subject.teacher?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={subject.status === "Active" ? "default" : "secondary"}>
                    {subject.status}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(subject)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editing}
        classes={classes}
        teachers={teachers}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete subject"
        description={`Delete "${deleting?.name}"? This can't be undone. Subjects with exams linked can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
