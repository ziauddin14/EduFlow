"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAYS } from "@/types";
import type { ClassListItem, SubjectListItem, TeacherOption } from "@/lib/types/academics";
import type { TimetableSlot } from "@/lib/types/timetable";

const formSchema = z
  .object({
    class: z.string().min(1, "Class is required."),
    section: z.string().min(1, "Section is required."),
    day: z.enum(WEEKDAYS),
    subject: z.string().min(1, "Subject is required."),
    teacher: z.string().min(1, "Teacher is required."),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
    room: z.string(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

type FormValues = z.infer<typeof formSchema>;

export function EntryFormDialog({
  open,
  onOpenChange,
  slot,
  defaultClassId,
  defaultSection,
  defaultDay,
  classes,
  subjects,
  teachers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: TimetableSlot | null;
  defaultClassId: string;
  defaultSection: string;
  defaultDay?: string;
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  teachers: TeacherOption[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(slot);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class: defaultClassId,
      section: defaultSection,
      day: (defaultDay as (typeof WEEKDAYS)[number]) ?? WEEKDAYS[0],
      subject: "",
      teacher: "",
      startTime: "09:00",
      endTime: "09:45",
      room: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        class: defaultClassId,
        section: defaultSection,
        day: (defaultDay as (typeof WEEKDAYS)[number]) ?? WEEKDAYS[0],
        subject: slot?.subject?._id ?? "",
        teacher: slot?.teacher?._id ?? "",
        startTime: slot?.startTime ?? "09:00",
        endTime: slot?.endTime ?? "09:45",
        room: slot?.room ?? "",
      });
    }
  }, [open, slot, defaultClassId, defaultSection, defaultDay, form]);

  const selectedClassId = form.watch("class");
  const availableSubjects = useMemo(
    () => subjects.filter((s) => s.class?._id === selectedClassId),
    [subjects, selectedClassId]
  );
  const availableSections = classes.find((c) => c._id === selectedClassId)?.sections ?? [];

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/timetable/${slot!._id}` : "/api/timetable";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(isEdit ? "Timetable entry updated." : "Timetable entry created.");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit timetable entry" : "Add timetable entry"}</DialogTitle>
          <DialogDescription>
            Conflicts with existing class or teacher schedules are rejected automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("subject", "");
                        form.setValue("section", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedClassId}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSections.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedClassId}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSubjects.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacher"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Teacher</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Room (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Room 204" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
