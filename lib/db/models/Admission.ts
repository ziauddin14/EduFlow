import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ADMISSION_STATUSES } from "@/types";

const admissionSchema = new Schema(
  {
    applicantName: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    desiredClass: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    applicationDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ADMISSION_STATUSES, default: "New" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

admissionSchema.index({ status: 1 });

export type AdmissionDoc = InferSchemaType<typeof admissionSchema>;

export const Admission = models.Admission || model("Admission", admissionSchema);
