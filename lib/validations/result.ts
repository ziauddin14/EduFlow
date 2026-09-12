import { z } from "zod";
import { objectIdSchema } from "@/lib/validations/common";

export const resultEntrySchema = z.object({
  student: objectIdSchema,
  obtainedMarks: z.coerce.number().min(0, "Marks cannot be negative."),
});

export const resultsBulkInputSchema = z.object({
  exam: objectIdSchema,
  entries: z.array(resultEntrySchema).min(1, "At least one result is required."),
});

export type ResultsBulkInput = z.infer<typeof resultsBulkInputSchema>;

export const resultUpdateSchema = z.object({
  obtainedMarks: z.coerce.number().min(0, "Marks cannot be negative."),
});

export type ResultUpdateInput = z.infer<typeof resultUpdateSchema>;
