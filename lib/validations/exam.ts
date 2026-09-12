import { z } from "zod";
import { EXAM_TYPES } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const examInputSchema = z
  .object({
    name: z.string().trim().min(1, "Exam name is required.").max(120),
    type: z.enum(EXAM_TYPES),
    class: objectIdSchema,
    subject: objectIdSchema,
    date: z.coerce.date({ error: "A valid date is required." }),
    maxMarks: z.coerce.number().min(1, "Max marks must be at least 1."),
    passingMarks: z.coerce.number().min(0, "Passing marks cannot be negative."),
  })
  .refine((data) => data.passingMarks <= data.maxMarks, {
    message: "Passing marks cannot exceed max marks.",
    path: ["passingMarks"],
  });

export type ExamInput = z.infer<typeof examInputSchema>;
