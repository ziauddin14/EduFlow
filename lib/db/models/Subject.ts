import { Schema, model, models, type InferSchemaType } from "mongoose";
import { SUBJECT_STATUSES } from "@/types";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    status: { type: String, enum: SUBJECT_STATUSES, default: "Active" },
  },
  { timestamps: true }
);

subjectSchema.index({ class: 1 });

export type SubjectDoc = InferSchemaType<typeof subjectSchema>;

export const Subject = models.Subject || model("Subject", subjectSchema);
