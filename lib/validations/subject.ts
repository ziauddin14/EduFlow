import { z } from "zod";
import { SUBJECT_STATUSES } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const subjectInputSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required.").max(60),
  code: z.string().trim().min(1, "Subject code is required.").max(20),
  class: objectIdSchema,
  teacher: objectIdSchema.nullable().optional(),
  status: z.enum(SUBJECT_STATUSES).default("Active"),
});

export type SubjectInput = z.infer<typeof subjectInputSchema>;
