import { Schema, model, Document } from "mongoose";

export interface IApplication extends Document {
  key: string;
  name: string;
  description?: string;
  poc?: { name?: string; email?: string };
  type?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  poc: {
    name: String,
    email: String
  },
  type: { type: String, enum: ["internal","external","partner","other"], default: "internal" }
}, { timestamps: true });

export const Application = model<IApplication>("Application", ApplicationSchema);
