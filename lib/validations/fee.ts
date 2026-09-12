import { z } from "zod";
import { objectIdSchema } from "@/lib/validations/common";

export const feeInputSchema = z
  .object({
    student: objectIdSchema,
    title: z.string().trim().min(1, "Fee title is required.").max(120),
    totalAmount: z.number().min(0, "Total amount cannot be negative."),
    paidAmount: z.number().min(0, "Paid amount cannot be negative.").default(0),
    dueDate: z.coerce.date({ error: "A valid due date is required." }),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .refine((data) => data.paidAmount <= data.totalAmount, {
    message: "Paid amount cannot exceed the total amount.",
    path: ["paidAmount"],
  });

export type FeeInput = z.infer<typeof feeInputSchema>;

export const feePaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero."),
  method: z.string().trim().min(1).max(40).optional().default("Cash"),
});

export type FeePaymentInput = z.infer<typeof feePaymentSchema>;

export const feeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional().default(""),
  classId: z.string().trim().optional().default(""),
  status: z.string().trim().optional().default(""),
  month: z.string().trim().optional().default(""),
});
