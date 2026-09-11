import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { GRADES, RESULT_STATUSES } from "@/types";

const resultSchema = new Schema(
  {
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, enum: GRADES, required: true },
    status: { type: String, enum: RESULT_STATUSES, required: true },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });
resultSchema.index({ student: 1 });

export type ResultDoc = InferSchemaType<typeof resultSchema>;

export const Result = models.Result || model("Result", resultSchema);
