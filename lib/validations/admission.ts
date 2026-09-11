import { z } from "zod";
import { ADMISSION_STATUSES, GENDERS } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const admissionInputSchema = z.object({
  applicantName: z.string().trim().min(1, "Applicant name is required.").max(120),
  guardianName: z.string().trim().min(1, "Guardian name is required.").max(120),
  contact: z.string().trim().min(1, "Contact is required.").max(30),
  desiredClass: objectIdSchema,
  applicationDate: z.coerce.date({ error: "A valid application date is required." }),
  notes: z.string().trim().max(1000).optional().default(""),
});

export type AdmissionInput = z.infer<typeof admissionInputSchema>;

export const admissionStatusSchema = z.object({
  status: z.enum(ADMISSION_STATUSES),
});

export const admissionEnrollSchema = z.object({
  dob: z.coerce.date({ error: "A valid date of birth is required." }),
  gender: z.enum(GENDERS),
  section: z.string().trim().min(1, "Section is required."),
  address: z.string().trim().min(1, "Address is required.").max(300),
});

export type AdmissionEnrollInput = z.infer<typeof admissionEnrollSchema>;
