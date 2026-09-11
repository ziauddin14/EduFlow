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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdmissionListItem } from "@/lib/types/admissions";
import type { ClassListItem } from "@/lib/types/academics";

const formSchema = z.object({
  applicantName: z.string().trim().min(1, "Applicant name is required."),
  guardianName: z.string().trim().min(1, "Guardian name is required."),
  contact: z.string().trim().min(1, "Contact is required."),
  desiredClass: z.string().min(1, "Desired class is required."),
  applicationDate: z.string().min(1, "Application date is required."),
  notes: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function AdmissionFormDialog({
  open,
  onOpenChange,
  admission,
  classes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: AdmissionListItem | null;
  classes: ClassListItem[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(admission);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: "",
      guardianName: "",
      contact: "",
      desiredClass: "",
      applicationDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        applicantName: admission?.applicantName ?? "",
        guardianName: admission?.guardianName ?? "",
        contact: admission?.contact ?? "",
        desiredClass: admission?.desiredClass?._id ?? "",
        applicationDate: toDateInputValue(admission?.applicationDate) || new Date().toISOString().slice(0, 10),
        notes: admission?.notes ?? "",
      });
    }
  }, [open, admission, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admissions/${admission!._id}` : "/api/admissions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Something went wrong.");
        return;
      }

      toast.success(isEdit ? "Admission updated." : "Admission recorded.");
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
          <DialogTitle>{isEdit ? "Edit admission" : "New admission"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update applicant details." : "Record a new admission inquiry."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="applicantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicant name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desiredClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired class</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
              name="applicationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create admission"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
