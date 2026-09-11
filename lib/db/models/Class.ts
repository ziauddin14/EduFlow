import { Schema, model, models, type InferSchemaType } from "mongoose";

const classSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sections: { type: [String], default: ["A"] },
    classTeacher: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true }
);

classSchema.index({ name: 1 }, { unique: true });

export type ClassDoc = InferSchemaType<typeof classSchema>;

export const Class = models.Class || model("Class", classSchema);
