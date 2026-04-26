# RequirementsBuilder — Saved Place

Date: 2026-04-20

This file captures the current data model, JSON Schema validators, index commands, and the TODO snapshot for the RequirementsBuilder project.

## TODO snapshot

- [x] Define features & fields
- [x] Design MongoDB schema
- [x] Scaffold backend API (Express/TS)
- [x] Scaffold Angular frontend
- [x] Implement CRUD and search/filter
- [ ] Connect to MongoDB & persist data
- [ ] Add tests and documentation

---

## Data model (summary)

Collections:

- `applications`
- `requirements`
- `users`
- `tags` (optional)
- `requirement_audit`

Design notes:

- Embed bounded, frequently-read-together data (small comments/attachments metadata).
- Reference shared or large entities (`applicationId`, `user` references).
- Keep documents < 16MB; store files in object storage and save URLs.
- Use a separate audit collection to track changes.
- Start with `validationAction: "warn"`, then tighten to `error` when ready.

---

## MongoDB JSON Schema validators and index commands

1. `applications`

```js
db.createCollection('applications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'name', 'createdAt'],
      properties: {
        key: { bsonType: 'string', description: 'unique app key' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        poc: {
          bsonType: 'object',
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
          },
        },
        type: { enum: ['internal', 'external', 'partner', 'other'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.applications.createIndex({ key: 1 }, { unique: true });
```

2. `requirements`

```js
db.createCollection('requirements', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['applicationId', 'title', 'status', 'createdAt'],
      properties: {
        applicationId: { bsonType: 'objectId' },
        title: { bsonType: 'string', minLength: 1 },
        description: { bsonType: 'string' },
        status: { enum: ['draft', 'proposed', 'approved', 'in-progress', 'done', 'archived'] },
        priority: { enum: ['low', 'med', 'high', 'critical'] },
        type: { enum: ['feature', 'bug', 'non-functional', 'task'] },
        ownerId: { bsonType: 'objectId' },
        assignees: { bsonType: 'array', items: { bsonType: 'objectId' }, maxItems: 50 },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        estimate: {
          bsonType: 'object',
          properties: {
            points: { bsonType: 'int' },
            hours: { bsonType: 'double' },
          },
        },
        acceptanceCriteria: { bsonType: 'array', items: { bsonType: 'string' } },
        attachments: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              name: { bsonType: 'string' },
              url: { bsonType: 'string' },
              uploadedBy: { bsonType: 'objectId' },
              createdAt: { bsonType: 'date' },
            },
          },
        },
        lastUpdatedBy: { bsonType: 'objectId' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.requirements.createIndex({ applicationId: 1, status: 1 });
db.requirements.createIndex({ applicationId: 1, priority: -1, updatedAt: -1 });
db.requirements.createIndex({ tags: 1 });
db.requirements.createIndex({ ownerId: 1 });
db.requirements.createIndex(
  { title: 'text', description: 'text', acceptanceCriteria: 'text' },
  { name: 'requirements_text' },
);
```

3. `users`

```js
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'createdAt'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
        role: { enum: ['viewer', 'editor', 'admin', 'owner'] },
        active: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.users.createIndex({ email: 1 }, { unique: true });
```

4. `tags` (optional)

```js
db.createCollection('tags', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'createdAt'],
      properties: {
        name: { bsonType: 'string' },
        color: { bsonType: 'string' },
        createdBy: { bsonType: 'objectId' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.tags.createIndex({ name: 1 }, { unique: true });
```

5. `requirement_audit`

```js
db.createCollection('requirement_audit', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['requirementId', 'changeType', 'changedBy', 'createdAt'],
      properties: {
        requirementId: { bsonType: 'objectId' },
        applicationId: { bsonType: 'objectId' },
        changeType: { enum: ['create', 'update', 'status_change', 'assign', 'comment', 'delete'] },
        changedBy: { bsonType: 'objectId' },
        diff: { bsonType: 'object' },
        note: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

db.requirement_audit.createIndex({ requirementId: 1, createdAt: -1 });
```

---

## Next steps

- Install backend persistence dependencies (`mongoose`, `dotenv`, and matching test helpers).
- Add shared TypeScript domain types for the application shell and API handlers.
- Add Mongoose schemas/models matching the validators above.
- Add Express API routes before the Angular SSR catch-all route.

---

## TypeScript domain model

These interfaces describe the application-level shape used by the API and UI. Mongoose
documents will add `_id`, timestamps, and helper methods, so keep transport DTOs separate
from persistence documents.

```ts
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
```

## API DTOs

Create and update payloads should be narrower than full documents. The server owns generated
fields such as `id`, `createdAt`, `updatedAt`, and audit entries.

```ts
export interface CreateApplicationRequest {
  key: string;
  name: string;
  description?: string;
  poc?: ApplicationPoc;
  type?: ApplicationType;
}

export type UpdateApplicationRequest = Partial<CreateApplicationRequest>;

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
  status?: RequirementStatus;
  priority?: RequirementPriority;
  ownerId?: ObjectIdString;
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}
```

## API route plan

Mount these routes under `/api` before the Angular SSR fallback in `src/server.ts`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/applications` | List application profiles |
| `POST` | `/api/applications` | Create application profile |
| `GET` | `/api/applications/:id` | Read one application profile |
| `PATCH` | `/api/applications/:id` | Update application profile |
| `DELETE` | `/api/applications/:id` | Archive or remove application profile |
| `GET` | `/api/requirements` | Search/filter requirements |
| `POST` | `/api/requirements` | Create requirement |
| `GET` | `/api/requirements/:id` | Read one requirement |
| `PATCH` | `/api/requirements/:id` | Update requirement |
| `POST` | `/api/requirements/:id/attachments` | Add attachment metadata |
| `GET` | `/api/requirements/:id/audit` | Read requirement audit history |
| `GET` | `/api/tags` | List available tags |
| `POST` | `/api/tags` | Create tag |
| `GET` | `/api/users` | List users for assignment/ownership |

## Mongoose model conventions

- Use `timestamps: true` for `createdAt` and `updatedAt` instead of setting both manually.
- Use `toJSON` transforms to expose `id` and hide `_id`/`__v` from API responses.
- Keep enum arrays in one shared constants file so Angular forms and Mongoose schemas do not drift.
- Store `applicationId`, `ownerId`, `assignees`, `uploadedBy`, and audit user fields as `Schema.Types.ObjectId`.
- Normalize tag names to lowercase in the API layer before persistence.
- Prefer soft-delete/archive for requirements; hard-delete only after audit and retention rules are decided.

Example schema skeleton:

```ts
import { Schema, model, Types } from 'mongoose';

const requirementSchema = new Schema(
  {
    applicationId: { type: Types.ObjectId, ref: 'Application', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'proposed', 'approved', 'in-progress', 'done', 'archived'],
      default: 'draft',
      required: true,
      index: true,
    },
    priority: { type: String, enum: ['low', 'med', 'high', 'critical'], default: 'med' },
    type: { type: String, enum: ['feature', 'bug', 'non-functional', 'task'], default: 'feature' },
    ownerId: { type: Types.ObjectId, ref: 'User' },
    assignees: [{ type: Types.ObjectId, ref: 'User' }],
    tags: [{ type: String, trim: true, lowercase: true }],
    estimate: {
      points: { type: Number, min: 0 },
      hours: { type: Number, min: 0 },
    },
    acceptanceCriteria: [{ type: String, trim: true }],
    attachments: [
      {
        name: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        uploadedBy: { type: Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastUpdatedBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

requirementSchema.index({ applicationId: 1, status: 1 });
requirementSchema.index({ applicationId: 1, priority: -1, updatedAt: -1 });
requirementSchema.index({ tags: 1 });
requirementSchema.index({ ownerId: 1 });
requirementSchema.index(
  { title: 'text', description: 'text', acceptanceCriteria: 'text' },
  { name: 'requirements_text' },
);

export const RequirementModel = model('Requirement', requirementSchema);
```

## State and validation rules

- Default new requirements to `draft`.
- Allow `draft -> proposed -> approved -> in-progress -> done`.
- Allow any active state to move to `archived`.
- Require at least one acceptance criterion before moving to `approved`.
- Require `ownerId` before moving to `in-progress`.
- Write an audit entry for create, update, status change, assignment change, attachment add, and delete/archive.
- Treat user identity as required for mutating endpoints even if authentication starts as a local stub.

## Query behavior

- Default requirement list sort: `updatedAt desc`.
- Default page size: `25`; max page size: `100`.
- Text search uses the `requirements_text` index and should combine with `applicationId` filters when present.
- Tag filtering should match normalized lowercase tag names.
- Application profile list should sort by `name asc`.

## Seed data shape

```js
const seedApplications = [
  {
    key: 'REQ',
    name: 'RequirementsBuilder',
    description: 'Internal requirements tracking and planning application.',
    poc: { name: 'Product Owner', email: 'owner@example.com' },
    type: 'internal',
  },
];

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'owner',
    active: true,
  },
];
```
