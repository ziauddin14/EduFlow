import { z } from "zod";
import { WEEKDAYS } from "@/types";
import { objectIdSchema } from "@/lib/validations/common";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM format.");

export const timetableEntryInputSchema = z
  .object({
    class: objectIdSchema,
    section: z.string().trim().min(1, "Section is required."),
    day: z.enum(WEEKDAYS),
    subject: objectIdSchema,
    teacher: objectIdSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    room: z.string().trim().max(40).optional().default(""),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type TimetableEntryInput = z.infer<typeof timetableEntryInputSchema>;
