import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { WEEKDAYS } from "@/types";

const slotSchema = new Schema(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "" },
  },
  { _id: false }
);

const timetableSchema = new Schema(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    section: { type: String, required: true },
    day: { type: String, enum: WEEKDAYS, required: true },
    slots: { type: [slotSchema], default: [] },
  },
  { timestamps: true }
);

timetableSchema.index({ class: 1, section: 1, day: 1 }, { unique: true });

export type TimetableDoc = InferSchemaType<typeof timetableSchema>;

export const Timetable = models.Timetable || model("Timetable", timetableSchema);
