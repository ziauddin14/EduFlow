import { z } from "zod";
import { ATTENDANCE_STATUSES } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

export const attendanceMarkSchema = z.object({
  class: objectIdSchema,
  section: z.string().trim().min(1, "Section is required."),
  date: z.coerce.date({ error: "A valid date is required." }),
  records: z
    .array(
      z.object({
        student: objectIdSchema,
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1, "At least one attendance record is required."),
});

export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;

export const attendanceUpdateSchema = z.object({
  records: z
    .array(
      z.object({
        student: objectIdSchema,
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1, "At least one attendance record is required."),
});

export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
