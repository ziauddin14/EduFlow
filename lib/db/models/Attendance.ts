import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ATTENDANCE_STATUSES } from "@/types";

const attendanceRecordSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
  },
  { _id: false }
);

const attendanceSchema = new Schema(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true },
    records: { type: [attendanceRecordSchema], default: [] },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ class: 1, section: 1, date: 1 }, { unique: true });

export type AttendanceDoc = InferSchemaType<typeof attendanceSchema>;

export const Attendance = models.Attendance || model("Attendance", attendanceSchema);
