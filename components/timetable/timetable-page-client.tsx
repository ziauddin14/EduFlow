"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { WeeklyGrid } from "@/components/timetable/weekly-grid";
import { EntryFormDialog } from "@/components/timetable/entry-form-dialog";
import type { ClassListItem, SubjectListItem, TeacherOption } from "@/lib/types/academics";
import type { TimetableDay, TimetableSlot } from "@/lib/types/timetable";

export function TimetablePageClient({
  classes,
  subjects,
  teachers,
}: {
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  teachers: TeacherOption[];
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [tab, setTab] = useState("class");
  const [classId, setClassId] = useState(classes[0]?._id ?? "");
  const [section, setSection] = useState(classes[0]?.sections[0] ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?._id ?? "");

  const [loading, setLoading] = useState(false);
  const [week, setWeek] = useState<TimetableDay[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ slot: TimetableSlot; day: string } | null>(null);
  const [deleting, setDeleting] = useState<TimetableSlot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  useEffect(() => {
    if (selectedClass && !sections.includes(section)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSection(sections[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  function load() {
    if (tab === "class") {
      if (!classId || !section) return;
      setLoading(true);
      fetch(`/api/timetable?classId=${classId}&section=${encodeURIComponent(section)}`)
        .then((res) => res.json())
        .then((json) => {
          if (!json.success) {
            toast.error(json.error ?? "Could not load timetable.");
            return;
          }
          setWeek(json.data);
        })
        .finally(() => setLoading(false));
    } else {
      if (!teacherId) return;
      setLoading(true);
      fetch(`/api/timetable?teacherId=${teacherId}`)
        .then((res) => res.json())
        .then((json) => {
          if (!json.success) {
            toast.error(json.error ?? "Could not load timetable.");
            return;
          }
          setWeek(json.data);
        })
        .finally(() => setLoading(false));
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [tab, classId, section, teacherId]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/timetable/${deleting._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not delete entry.");
        return;
      }
      toast.success("Timetable entry deleted.");
      setDeleting(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  }

  if (classes.length === 0) {
    return <EmptyState icon={CalendarDays} title="No classes available" />;
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="class">By class</TabsTrigger>
          <TabsTrigger value="teacher">By teacher</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-end justify-between gap-3 pt-6">
            <TabsContent value="class" className="mt-0 flex flex-wrap gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Class</p>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Section</p>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="teacher" className="mt-0">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Teacher</p>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {isAdmin && tab === "class" && (
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add entry
              </Button>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {loading ? (
        <div className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <WeeklyGrid
          week={week}
          canEdit={isAdmin && tab === "class"}
          showClass={tab === "teacher"}
          onEdit={(slot, day) => {
            setEditing({ slot, day });
            setFormOpen(true);
          }}
          onDelete={(slot) => setDeleting(slot)}
        />
      )}

      {isAdmin && (
        <EntryFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          slot={editing?.slot ?? null}
          defaultClassId={classId}
          defaultSection={section}
          defaultDay={editing?.day}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onSaved={load}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete timetable entry"
        description="Delete this scheduled class? This can't be undone."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
