import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { EXAM_TYPES } from "@/types";

const examSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: EXAM_TYPES, required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    maxMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

examSchema.index({ class: 1, date: 1 });

export type ExamDoc = InferSchemaType<typeof examSchema>;

export const Exam = models.Exam || model("Exam", examSchema);
