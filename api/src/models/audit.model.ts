import { Schema, model, Document, Types } from "mongoose";

export interface IAudit extends Document {
  requirementId: Types.ObjectId;
  applicationId?: Types.ObjectId;
  changeType: string;
  changedBy: Types.ObjectId;
  diff?: any;
  note?: string;
  createdAt: Date;
}

const AuditSchema = new Schema<IAudit>({
  requirementId: { type: Schema.Types.ObjectId, required: true, ref: 'Requirement' },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  changeType: { type: String, enum: ["create","update","status_change","assign","comment","delete"] },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  diff: Schema.Types.Mixed,
  note: String
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditSchema.index({ requirementId: 1, createdAt: -1 });

export const RequirementAudit = model<IAudit>('RequirementAudit', AuditSchema);
