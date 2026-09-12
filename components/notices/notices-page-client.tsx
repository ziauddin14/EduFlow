"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, Search, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NoticeFormDialog } from "@/components/notices/notice-form-dialog";
import { NOTICE_CATEGORIES } from "@/types";
import type { NoticeListItem } from "@/lib/types/notices";

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Holiday: "secondary",
  Exam: "outline",
  Event: "default",
  General: "secondary",
  Emergency: "destructive",
};

export function NoticesPageClient({ initialNotices }: { initialNotices: NoticeListItem[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeListItem | null>(null);
  const [deleting, setDeleting] = useState<NoticeListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialNotices.filter((n) => {
      const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || n.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [initialNotices, search, category]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/notices/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete notice.");
        return;
      }
      toast.success("Notice deleted.");
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleStatus(notice: NoticeListItem) {
    setToggling(notice._id);
    try {
      const nextStatus = notice.status === "Published" ? "Draft" : "Published";
      const res = await fetch(`/api/notices/${notice._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not update status.");
        return;
      }
      toast.success(nextStatus === "Published" ? "Notice published." : "Notice unpublished.");
      router.refresh();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notices…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {NOTICE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            New notice
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((notice) => (
            <Card key={notice._id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{notice.title}</CardTitle>
                  {isAdmin && notice.status === "Draft" && <Badge variant="outline">Draft</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={CATEGORY_VARIANT[notice.category]}>{notice.category}</Badge>
                  <Badge variant="secondary">{notice.audience}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{notice.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notice.date), "MMM d, yyyy")}
                    {notice.createdBy && ` · ${notice.createdBy.name}`}
                  </p>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={toggling === notice._id}
                        onClick={() => toggleStatus(notice)}
                        title={notice.status === "Published" ? "Unpublish" : "Publish"}
                      >
                        {notice.status === "Published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditing(notice);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleting(notice)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoticeFormDialog open={formOpen} onOpenChange={setFormOpen} notice={editing} onSaved={() => router.refresh()} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete notice"
        description={`Delete "${deleting?.title}"? This can't be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
