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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAFF_STATUSES } from "@/types";
import type { TeacherListItem } from "@/lib/types/teachers";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.email("A valid email is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  designation: z.string().trim().min(1, "Designation is required."),
  subjects: z.array(z.string()),
  classes: z.array(z.string()),
  joiningDate: z.string().min(1, "Joining date is required."),
  status: z.enum(STAFF_STATUSES),
});

type FormValues = z.infer<typeof formSchema>;

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  classes,
  subjects,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherListItem | null;
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(teacher);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      designation: "",
      subjects: [],
      classes: [],
      joiningDate: new Date().toISOString().slice(0, 10),
      status: "Active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: teacher?.name ?? "",
        email: teacher?.email ?? "",
        phone: teacher?.phone ?? "",
        designation: teacher?.designation ?? "",
        subjects: teacher?.subjects.map((s) => s._id) ?? [],
        classes: teacher?.classes.map((c) => c._id) ?? [],
        joiningDate: toDateInputValue(teacher?.joiningDate) || new Date().toISOString().slice(0, 10),
        status: teacher?.status ?? "Active",
      });
    }
  }, [open, teacher, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/teachers/${teacher!._id}` : "/api/teachers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(
        isEdit ? "Teacher updated." : "Teacher created. Default login password: Demo@123"
      );
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit teacher" : "Add teacher"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this teacher's details and assignments."
              : "New teachers get a login account with the default password Demo@123."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Subject Teacher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_STATUSES.map((s) => (
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
                name="classes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Assigned classes</FormLabel>
                    <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
                      {classes.map((c) => (
                        <label key={c._id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value.includes(c._id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, c._id]
                                  : field.value.filter((id) => id !== c._id)
                              );
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Assigned subjects</FormLabel>
                    <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
                      {subjects.map((s) => (
                        <label key={s._id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value.includes(s._id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, s._id]
                                  : field.value.filter((id) => id !== s._id)
                              );
                            }}
                          />
                          {s.name} ({s.class?.name})
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Add teacher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
