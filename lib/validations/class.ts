import { z } from "zod";
import { objectIdSchema } from "@/lib/validations/common";

export const classInputSchema = z.object({
  name: z.string().trim().min(1, "Class name is required.").max(60),
  sections: z
    .array(z.string().trim().min(1).max(10))
    .min(1, "At least one section is required.")
    .max(10),
  classTeacher: objectIdSchema.nullable().optional(),
});

export type ClassInput = z.infer<typeof classInputSchema>;
