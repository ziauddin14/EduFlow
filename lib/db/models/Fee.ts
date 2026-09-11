import mongoose, { type InferSchemaType } from "mongoose";
const { Schema, model, models } = mongoose;
import { FEE_STATUSES } from "@/types";

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, default: "Cash" },
  },
  { _id: false }
);

const feeSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    title: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: FEE_STATUSES, default: "Pending" },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1 });
feeSchema.index({ status: 1 });

export type FeeDoc = InferSchemaType<typeof feeSchema>;

export const Fee = models.Fee || model("Fee", feeSchema);
