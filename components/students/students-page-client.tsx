"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Search, Eye } from "lucide-react";
import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { STUDENT_STATUSES } from "@/types";
import type { StudentListItem } from "@/lib/types/students";
import type { ClassListItem } from "@/lib/types/academics";
import type { PaginatedResult } from "@/lib/validations/common";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Active: "default",
  Inactive: "secondary",
  Graduated: "outline",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function StudentsPageClient({
  result,
  classes,
  filters,
}: {
  result: PaginatedResult<StudentListItem>;
  classes: ClassListItem[];
  filters: { search: string; classId: string; status: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const isAdmin = session?.user.role === "ADMIN";

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentListItem | null>(null);
  const [deleting, setDeleting] = useState<StudentListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateParams({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(student: StudentListItem) {
    setEditing(student);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/students/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete student.");
        return;
      }
      toast.success("Student deleted.");
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
              placeholder="Search by name, ID, guardian…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Select value={filters.classId || "all"} onValueChange={(v) => updateParams({ classId: v === "all" ? "" : v })}>
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
          <Select value={filters.status || "all"} onValueChange={(v) => updateParams({ status: v === "all" ? "" : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STUDENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add student
          </Button>
        )}
      </div>

      {result.items.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.class?.name ?? "—"} {student.section}
                  </TableCell>
                  <TableCell>{student.guardianName}</TableCell>
                  <TableCell>{student.guardianPhone}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[student.status]}>{student.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/students/${student._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(student)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={goToPage}
          />
        </>
      )}

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        classes={classes}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete student"
        description={`Delete "${deleting?.name}"? This can't be undone. Students with attendance, fee, or result records can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
