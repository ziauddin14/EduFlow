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
import { EXAM_TYPES } from "@/types";
import type { ExamListItem } from "@/lib/types/exams";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Exam name is required."),
    type: z.enum(EXAM_TYPES),
    class: z.string().min(1, "Class is required."),
    subject: z.string().min(1, "Subject is required."),
    date: z.string().min(1, "Date is required."),
    maxMarks: z
      .string()
      .min(1, "Max marks is required.")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 1, "Max marks must be at least 1."),
    passingMarks: z
      .string()
      .min(1, "Passing marks is required.")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Passing marks cannot be negative."),
  })
  .refine((data) => Number(data.passingMarks) <= Number(data.maxMarks), {
    message: "Passing marks cannot exceed max marks.",
    path: ["passingMarks"],
  });

type FormValues = z.infer<typeof formSchema>;

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  classes,
  subjects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamListItem | null;
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(exam);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Unit Test",
      class: "",
      subject: "",
      date: new Date().toISOString().slice(0, 10),
      maxMarks: "100",
      passingMarks: "33",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: exam?.name ?? "",
        type: (exam?.type as (typeof EXAM_TYPES)[number]) ?? "Unit Test",
        class: exam?.class?._id ?? "",
        subject: exam?.subject?._id ?? "",
        date: toDateInputValue(exam?.date) || new Date().toISOString().slice(0, 10),
        maxMarks: String(exam?.maxMarks ?? 100),
        passingMarks: String(exam?.passingMarks ?? 33),
      });
    }
  }, [open, exam, form]);

  const selectedClassId = form.watch("class");
  const availableSubjects = useMemo(
    () => subjects.filter((s) => s.class?._id === selectedClassId),
    [subjects, selectedClassId]
  );

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = { ...values, maxMarks: Number(values.maxMarks), passingMarks: Number(values.passingMarks) };
      const res = await fetch(isEdit ? `/api/exams/${exam!._id}` : "/api/exams", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(isEdit ? "Exam updated." : "Exam created.");
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
          <DialogTitle>{isEdit ? "Edit exam" : "Create exam"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update exam details." : "Schedule a new exam for a class and subject."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam name</FormLabel>
                  <FormControl>
                    <Input placeholder="Midterm Examination" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXAM_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("subject", "");
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
                name="maxMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max marks</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing marks</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create exam"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
