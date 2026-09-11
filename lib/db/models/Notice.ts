import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { NOTICE_CATEGORIES, NOTICE_STATUSES } from "@/types";

const noticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: NOTICE_CATEGORIES, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: NOTICE_STATUSES, default: "Draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

noticeSchema.index({ status: 1, date: -1 });

export type NoticeDoc = InferSchemaType<typeof noticeSchema>;

export const Notice = models.Notice || model("Notice", noticeSchema);
