import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { STAFF_STATUSES } from "@/types";

const teacherSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: STAFF_STATUSES, default: "Active" },
  },
  { timestamps: true }
);

export type TeacherDoc = InferSchemaType<typeof teacherSchema>;

export const Teacher = models.Teacher || model("Teacher", teacherSchema);
