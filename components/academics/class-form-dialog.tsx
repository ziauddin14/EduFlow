"use client";

import { useEffect, useState } from "react";
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
import type { ClassListItem, TeacherOption } from "@/lib/types/academics";

const formSchema = z.object({
  name: z.string().trim().min(1, "Class name is required."),
  sections: z.string().trim().min(1, "At least one section is required."),
  classTeacher: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function ClassFormDialog({
  open,
  onOpenChange,
  classItem,
  teachers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: ClassListItem | null;
  teachers: TeacherOption[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(classItem);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", sections: "A", classTeacher: "none" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: classItem?.name ?? "",
        sections: classItem?.sections.join(", ") ?? "A",
        classTeacher: classItem?.classTeacher?._id ?? "none",
      });
    }
  }, [open, classItem, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        sections: values.sections
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        classTeacher: values.classTeacher === "none" ? null : values.classTeacher,
      };

      const res = await fetch(isEdit ? `/api/classes/${classItem!._id}` : "/api/classes", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(isEdit ? "Class updated." : "Class created.");
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
          <DialogTitle>{isEdit ? "Edit class" : "Create class"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update class details." : "Add a new class to the school."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class name</FormLabel>
                  <FormControl>
                    <Input placeholder="Class 8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sections</FormLabel>
                  <FormControl>
                    <Input placeholder="A, B, C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classTeacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class teacher</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
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
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create class"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
