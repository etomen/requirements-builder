export type ObjectIdString = string;

export type ApplicationType = 'internal' | 'external' | 'partner' | 'other';

export interface ApplicationPoc {
  name?: string;
  email?: string;
}

export interface ApplicationProfile {
  id: ObjectIdString;
  key: string;
  name: string;
  description?: string;
  poc?: ApplicationPoc;
  type?: ApplicationType;
  createdAt: string;
  updatedAt?: string;
}

export type RequirementStatus =
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'in-progress'
  | 'done'
  | 'archived';

export type RequirementPriority = 'low' | 'med' | 'high' | 'critical';
export type RequirementType = 'feature' | 'bug' | 'non-functional' | 'task';

export interface RequirementEstimate {
  points?: number;
  hours?: number;
}

export interface RequirementAttachment {
  name: string;
  url: string;
  uploadedBy?: ObjectIdString;
  createdAt: string;
}

export interface Requirement {
  id: ObjectIdString;
  applicationId: ObjectIdString;
  title: string;
  description?: string;
  status: RequirementStatus;
  priority?: RequirementPriority;
  type?: RequirementType;
  ownerId?: ObjectIdString;
  assignees: ObjectIdString[];
  tags: string[];
  estimate?: RequirementEstimate;
  acceptanceCriteria: string[];
  attachments: RequirementAttachment[];
  lastUpdatedBy?: ObjectIdString;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface User {
  id: ObjectIdString;
  name: string;
  email: string;
  role?: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Tag {
  id: ObjectIdString;
  name: string;
  color?: string;
  createdBy?: ObjectIdString;
  createdAt: string;
}

export type RequirementAuditChangeType =
  | 'create'
  | 'update'
  | 'status_change'
  | 'assign'
  | 'comment'
  | 'delete';

export interface RequirementAuditEntry {
  id: ObjectIdString;
  requirementId: ObjectIdString;
  applicationId?: ObjectIdString;
  changeType: RequirementAuditChangeType;
  changedBy: ObjectIdString;
  diff?: Record<string, unknown>;
  note?: string;
  createdAt: string;
}

export interface CreateRequirementRequest {
  applicationId: ObjectIdString;
  title: string;
  description?: string;
  status?: RequirementStatus;
  priority?: RequirementPriority;
  type?: RequirementType;
  ownerId?: ObjectIdString;
  assignees?: ObjectIdString[];
  tags?: string[];
  estimate?: RequirementEstimate;
  acceptanceCriteria?: string[];
}

export type UpdateRequirementRequest = Partial<Omit<CreateRequirementRequest, 'applicationId'>>;

export interface RequirementSearchQuery {
  applicationId?: ObjectIdString;
  status?: RequirementStatus | '';
  priority?: RequirementPriority | '';
  ownerId?: ObjectIdString;
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface RequirementSearchResponse {
  items: Requirement[];
  total: number;
  page: number;
  pageSize: number;
}

export const REQUIREMENT_STATUSES: RequirementStatus[] = [
  'draft',
  'proposed',
  'approved',
  'in-progress',
  'done',
  'archived',
];

export const REQUIREMENT_PRIORITIES: RequirementPriority[] = ['low', 'med', 'high', 'critical'];
export const REQUIREMENT_TYPES: RequirementType[] = ['feature', 'bug', 'non-functional', 'task'];
