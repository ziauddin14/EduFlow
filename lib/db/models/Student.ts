import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { GENDERS, STUDENT_STATUSES } from "@/types";

const studentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    dob: { type: Date, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: String, required: true },
    guardianName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    admissionDate: { type: Date, required: true },
    admission: { type: Schema.Types.ObjectId, ref: "Admission", default: null },
    status: { type: String, enum: STUDENT_STATUSES, default: "Active" },
  },
  { timestamps: true }
);

studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ name: "text" });

export type StudentDoc = InferSchemaType<typeof studentSchema>;

export const Student = models.Student || model("Student", studentSchema);
