import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role?: string;
  active?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["viewer","editor","admin","owner"], default: "viewer" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const User = model<IUser>("User", UserSchema);
