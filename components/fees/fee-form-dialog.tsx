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
import { Textarea } from "@/components/ui/textarea";
import { StudentCombobox } from "@/components/shared/student-combobox";
import type { FeeListItem } from "@/lib/types/fees";
import type { StudentOption } from "@/lib/types/students";

const formSchema = z.object({
  student: z.string().min(1, "Student is required."),
  title: z.string().trim().min(1, "Title is required."),
  totalAmount: z
    .string()
    .min(1, "Total amount is required.")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Total amount must be zero or greater."),
  dueDate: z.string().min(1, "Due date is required."),
  notes: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function FeeFormDialog({
  open,
  onOpenChange,
  fee,
  students,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: FeeListItem | null;
  students: StudentOption[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(fee);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { student: "", title: "", totalAmount: "0", dueDate: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        student: fee?.student?._id ?? "",
        title: fee?.title ?? "",
        totalAmount: String(fee?.totalAmount ?? 0),
        dueDate: toDateInputValue(fee?.dueDate) || new Date().toISOString().slice(0, 10),
        notes: fee?.notes ?? "",
      });
    }
  }, [open, fee, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = { ...values, totalAmount: Number(values.totalAmount), paidAmount: fee?.paidAmount ?? 0 };
      const res = await fetch(isEdit ? `/api/fees/${fee!._id}` : "/api/fees", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(isEdit ? "Fee record updated." : "Fee record created.");
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
          <DialogTitle>{isEdit ? "Edit fee record" : "Add fee record"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update fee details. Use Record Payment to change the paid amount."
              : "Create a new fee record for a student."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <FormControl>
                    <StudentCombobox students={students} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee title</FormLabel>
                  <FormControl>
                    <Input placeholder="Tuition Fee - Term 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isEdit && (
              <p className="text-sm text-muted-foreground">
                Paid so far: <span className="font-medium text-foreground">${fee?.paidAmount.toLocaleString()}</span>
              </p>
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create fee record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
