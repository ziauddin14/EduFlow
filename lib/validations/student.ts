import { z } from "zod";
import { GENDERS, STUDENT_STATUSES } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const studentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  dob: z.coerce.date({ error: "A valid date of birth is required." }),
  gender: z.enum(GENDERS),
  class: objectIdSchema,
  section: z.string().trim().min(1, "Section is required.").max(10),
  guardianName: z.string().trim().min(1, "Guardian name is required.").max(120),
  guardianPhone: z.string().trim().min(1, "Guardian phone is required.").max(30),
  address: z.string().trim().min(1, "Address is required.").max(300),
  admissionDate: z.coerce.date({ error: "A valid admission date is required." }),
  status: z.enum(STUDENT_STATUSES).default("Active"),
  admission: objectIdSchema.nullable().optional(),
});

export type StudentInput = z.infer<typeof studentInputSchema>;

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional().default(""),
  classId: z.string().trim().optional().default(""),
  status: z.string().trim().optional().default(""),
});
