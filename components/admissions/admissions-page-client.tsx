"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardList, Search, Eye } from "lucide-react";
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
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AdmissionFormDialog } from "@/components/admissions/admission-form-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ADMISSION_STATUSES } from "@/types";
import type { AdmissionListItem } from "@/lib/types/admissions";
import type { ClassListItem } from "@/lib/types/academics";
import type { PaginatedResult } from "@/lib/validations/common";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  New: "outline",
  "Under Review": "secondary",
  Approved: "default",
  Rejected: "destructive",
};

export function AdmissionsPageClient({
  result,
  classes,
  filters,
}: {
  result: PaginatedResult<AdmissionListItem>;
  classes: ClassListItem[];
  filters: { search: string; status: string };
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
  const [deleting, setDeleting] = useState<AdmissionListItem | null>(null);
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

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admissions/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete admission.");
        return;
      }
      toast.success("Admission deleted.");
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
              placeholder="Search applicants…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Select value={filters.status || "all"} onValueChange={(v) => updateParams({ status: v === "all" ? "" : v })}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ADMISSION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New admission
          </Button>
        )}
      </div>

      {result.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No admissions found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Desired class</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((admission) => (
                <TableRow key={admission._id}>
                  <TableCell className="font-medium">{admission.applicantName}</TableCell>
                  <TableCell>{admission.guardianName}</TableCell>
                  <TableCell>{admission.desiredClass?.name ?? "—"}</TableCell>
                  <TableCell>{format(new Date(admission.applicationDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[admission.status]}>{admission.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admissions/${admission._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isAdmin && admission.status !== "Approved" && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(admission)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={goToPage} />
        </>
      )}

      <AdmissionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        admission={null}
        classes={classes}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete admission"
        description={`Delete the admission for "${deleting?.applicantName}"? This can't be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
