import { z } from "zod";
import { NOTICE_CATEGORIES, NOTICE_AUDIENCES, NOTICE_STATUSES } from "@/types";

export const noticeInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  category: z.enum(NOTICE_CATEGORIES),
  audience: z.enum(NOTICE_AUDIENCES).default("Everyone"),
  date: z.coerce.date({ error: "A valid date is required." }),
  status: z.enum(NOTICE_STATUSES).default("Draft"),
});

export type NoticeInput = z.infer<typeof noticeInputSchema>;

export const noticeStatusSchema = z.object({
  status: z.enum(NOTICE_STATUSES),
});
