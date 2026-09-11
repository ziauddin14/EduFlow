import { z } from "zod";
import { STAFF_STATUSES } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const teacherInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.email("A valid email is required.").trim().toLowerCase(),
  phone: z.string().trim().min(1, "Phone is required.").max(30),
  designation: z.string().trim().min(1, "Designation is required.").max(80),
  subjects: z.array(objectIdSchema).default([]),
  classes: z.array(objectIdSchema).default([]),
  joiningDate: z.coerce.date({ error: "A valid joining date is required." }),
  status: z.enum(STAFF_STATUSES).default("Active"),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;

export const staffInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.email("A valid email is required.").trim().toLowerCase(),
  status: z.enum(STAFF_STATUSES).default("Active"),
});

export type StaffInput = z.infer<typeof staffInputSchema>;
