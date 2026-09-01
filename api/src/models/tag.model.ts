import { Schema, model, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  color?: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  color: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Tag = model<ITag>('Tag', TagSchema);
