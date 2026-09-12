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
import type { FeeListItem } from "@/lib/types/fees";

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Payment amount must be greater than zero."),
  method: z.string().trim().min(1, "Payment method is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentDialog({
  open,
  onOpenChange,
  fee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: FeeListItem | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const remaining = fee ? fee.totalAmount - fee.paidAmount : 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: "0", method: "Cash" },
  });

  useEffect(() => {
    if (open && fee) {
      form.reset({ amount: String(fee.totalAmount - fee.paidAmount), method: "Cash" });
    }
  }, [open, fee, form]);

  async function onSubmit(values: FormValues) {
    if (!fee) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/fees/${fee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment", amount: Number(values.amount), method: values.method }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Could not record payment.");
        return;
      }

      toast.success("Payment recorded.");
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
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {fee && `${fee.student?.name} — ${fee.title}. Remaining balance: $${remaining.toLocaleString()}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} step="0.01" max={remaining} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <Input placeholder="Cash, Card, Bank Transfer…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Recording…" : "Record payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
