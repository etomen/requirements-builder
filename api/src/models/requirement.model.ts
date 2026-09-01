import { Schema, model, Document, Types } from "mongoose";

export interface IRequirement extends Document {
  applicationId: Types.ObjectId;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  type?: string;
  ownerId?: Types.ObjectId;
  assignees?: Types.ObjectId[];
  tags?: string[];
  estimate?: { points?: number; hours?: number };
  acceptanceCriteria?: string[];
  attachments?: { name?: string; url?: string; uploadedBy?: Types.ObjectId; createdAt?: Date }[];
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const AttachmentSchema = new Schema({
  name: String,
  url: String,
  uploadedBy: Schema.Types.ObjectId,
  createdAt: Date
}, { _id: false });

const RequirementSchema = new Schema<IRequirement>({
  applicationId: { type: Schema.Types.ObjectId, required: true, ref: 'Application' },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["draft","proposed","approved","in-progress","done","archived"], default: "draft" },
  priority: { type: String, enum: ["low","med","high","critical"], default: "med" },
  type: { type: String, enum: ["feature","bug","non-functional","task"], default: "feature" },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  estimate: {
    points: Number,
    hours: Number
  },
  acceptanceCriteria: [String],
  attachments: [AttachmentSchema],
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

RequirementSchema.index({ applicationId: 1, status: 1 });
RequirementSchema.index({ applicationId: 1, priority: -1, updatedAt: -1 });
RequirementSchema.index({ tags: 1 });
RequirementSchema.index({ title: 'text', description: 'text', acceptanceCriteria: 'text' }, { name: 'requirements_text' });

export const Requirement = model<IRequirement>('Requirement', RequirementSchema);
