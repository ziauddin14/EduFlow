"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, Search, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { FeeFormDialog } from "@/components/fees/fee-form-dialog";
import { PaymentDialog } from "@/components/fees/payment-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FEE_STATUSES } from "@/types";
import type { FeeListItem, FeeSummary } from "@/lib/types/fees";
import type { ClassListItem } from "@/lib/types/academics";
import type { StudentOption } from "@/lib/types/students";
import type { PaginatedResult } from "@/lib/validations/common";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Paid: "default",
  Partial: "secondary",
  Pending: "outline",
  Overdue: "destructive",
};

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

export function FeesPageClient({
  result,
  summary,
  classes,
  students,
  filters,
}: {
  result: PaginatedResult<FeeListItem>;
  summary: FeeSummary;
  classes: ClassListItem[];
  students: StudentOption[];
  filters: { search: string; classId: string; status: string; month: string };
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
  const [editing, setEditing] = useState<FeeListItem | null>(null);
  const [paying, setPaying] = useState<FeeListItem | null>(null);
  const [deleting, setDeleting] = useState<FeeListItem | null>(null);
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
      const res = await fetch(`/api/fees/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete fee record.");
        return;
      }
      toast.success("Fee record deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total fees</p>
            <p className="text-2xl font-semibold">{money(summary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-2xl font-semibold text-success">{money(summary.collectedAmount)}</p>
            <p className="text-xs text-muted-foreground">{summary.collectedPercentage}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold text-warning">{money(summary.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-semibold text-destructive">{money(summary.overdueAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-56 pl-8"
              />
            </div>
            <Select value={filters.classId || "all"} onValueChange={(v) => updateParams({ classId: v === "all" ? "" : v })}>
              <SelectTrigger className="w-36">
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {FEE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={filters.month}
              onChange={(e) => updateParams({ month: e.target.value })}
              className="w-40"
            />
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add fee record
            </Button>
          )}
        </div>

        {result.items.length === 0 ? (
          <EmptyState icon={Wallet} title="No fee records found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((fee) => (
                  <TableRow key={fee._id}>
                    <TableCell>
                      <p className="font-medium">{fee.student?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee.student?.studentId} &middot; {fee.student?.class?.name}
                      </p>
                    </TableCell>
                    <TableCell>{fee.title}</TableCell>
                    <TableCell>{money(fee.totalAmount)}</TableCell>
                    <TableCell>{money(fee.paidAmount)}</TableCell>
                    <TableCell>{money(fee.totalAmount - fee.paidAmount)}</TableCell>
                    <TableCell>{format(new Date(fee.dueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[fee.status]}>{fee.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && fee.status !== "Paid" && (
                        <Button variant="ghost" size="icon" onClick={() => setPaying(fee)} title="Record payment">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(fee);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(fee)}>
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
      </div>

      <FeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        fee={editing}
        students={students}
        onSaved={() => router.refresh()}
      />

      <PaymentDialog
        open={Boolean(paying)}
        onOpenChange={(open) => !open && setPaying(null)}
        fee={paying}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete fee record"
        description={`Delete this fee record for "${deleting?.student?.name}"? This can't be undone. Records with recorded payments can't be deleted.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
