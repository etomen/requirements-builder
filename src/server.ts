import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

type ObjectIdString = string;
type ApplicationType = 'internal' | 'external' | 'partner' | 'other';
type RequirementStatus = 'draft' | 'proposed' | 'approved' | 'in-progress' | 'done' | 'archived';
type RequirementPriority = 'low' | 'med' | 'high' | 'critical';
type RequirementType = 'feature' | 'bug' | 'non-functional' | 'task';
type RequirementAuditChangeType =
  | 'create'
  | 'update'
  | 'status_change'
  | 'assign'
  | 'comment'
  | 'delete';

interface ApplicationProfile {
  id: ObjectIdString;
  key: string;
  name: string;
  description?: string;
  poc?: {
    name?: string;
    email?: string;
  };
  type?: ApplicationType;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  id: ObjectIdString;
  name: string;
  email: string;
  role?: 'viewer' | 'editor' | 'admin' | 'owner';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Tag {
  id: ObjectIdString;
  name: string;
  color?: string;
  createdBy?: ObjectIdString;
  createdAt: string;
}

interface Requirement {
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
  estimate?: {
    points?: number;
    hours?: number;
  };
  acceptanceCriteria: string[];
  attachments: {
    name: string;
    url: string;
    uploadedBy?: ObjectIdString;
    createdAt: string;
  }[];
  lastUpdatedBy?: ObjectIdString;
  createdAt: string;
  updatedAt?: string;
}

interface RequirementAuditEntry {
  id: ObjectIdString;
  requirementId: ObjectIdString;
  applicationId?: ObjectIdString;
  changeType: RequirementAuditChangeType;
  changedBy: ObjectIdString;
  diff?: Record<string, unknown>;
  note?: string;
  createdAt: string;
}

const systemUserId = 'usr_admin';
let idCounter = 100;

const applications: ApplicationProfile[] = [
  {
    id: 'app_req',
    key: 'REQ',
    name: 'RequirementsBuilder',
    description: 'Internal requirements tracking and planning application.',
    poc: { name: 'Product Owner', email: 'owner@example.com' },
    type: 'internal',
    createdAt: new Date('2026-04-20T12:00:00.000Z').toISOString(),
  },
];

const users: User[] = [
  {
    id: systemUserId,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'owner',
    active: true,
    createdAt: new Date('2026-04-20T12:00:00.000Z').toISOString(),
  },
  {
    id: 'usr_editor',
    name: 'Product Editor',
    email: 'editor@example.com',
    role: 'editor',
    active: true,
    createdAt: new Date('2026-04-20T12:00:00.000Z').toISOString(),
  },
];

const tags: Tag[] = [
  { id: 'tag_api', name: 'api', color: '#175cd3', createdBy: systemUserId, createdAt: now() },
  { id: 'tag_security', name: 'security', color: '#b42318', createdBy: systemUserId, createdAt: now() },
];

const requirements: Requirement[] = [
  {
    id: 'req_001',
    applicationId: 'app_req',
    title: 'Capture application profiles',
    description: 'Create and maintain application keys, names, descriptions, POCs, and types.',
    status: 'approved',
    priority: 'high',
    type: 'feature',
    ownerId: 'usr_editor',
    assignees: ['usr_editor'],
    tags: ['api'],
    estimate: { points: 5, hours: 12 },
    acceptanceCriteria: [
      'Application key is unique.',
      'POC email is validated before save.',
      'Profiles can be listed and selected when creating requirements.',
    ],
    attachments: [],
    lastUpdatedBy: systemUserId,
    createdAt: new Date('2026-04-20T13:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-21T13:00:00.000Z').toISOString(),
  },
  {
    id: 'req_002',
    applicationId: 'app_req',
    title: 'Search requirements by text and tags',
    description: 'Filter requirements by title, status, priority, owner, and normalized tags.',
    status: 'in-progress',
    priority: 'critical',
    type: 'feature',
    ownerId: systemUserId,
    assignees: [systemUserId],
    tags: ['api', 'security'],
    estimate: { points: 8, hours: 18 },
    acceptanceCriteria: [
      'Search matches title, description, and acceptance criteria.',
      'Tag filters are case-insensitive.',
    ],
    attachments: [],
    lastUpdatedBy: systemUserId,
    createdAt: new Date('2026-04-22T13:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-23T13:00:00.000Z').toISOString(),
  },
];

const auditEntries: RequirementAuditEntry[] = requirements.map((requirement) => ({
  id: nextId('aud'),
  requirementId: requirement.id,
  applicationId: requirement.applicationId,
  changeType: 'create',
  changedBy: systemUserId,
  note: 'Seed requirement created.',
  createdAt: requirement.createdAt,
}));

app.use(express.json());

app.get('/api/applications', (_req, res) => {
  res.json([...applications].sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/applications', (req, res) => {
  const key = String(req.body?.key ?? '').trim().toUpperCase();
  const name = String(req.body?.name ?? '').trim();

  if (!key || !name) {
    res.status(400).json({ error: 'Application key and name are required.' });
    return;
  }

  if (applications.some((application) => application.key === key)) {
    res.status(409).json({ error: 'Application key already exists.' });
    return;
  }

  const createdAt = now();
  const application: ApplicationProfile = {
    id: nextId('app'),
    key,
    name,
    description: cleanString(req.body?.description),
    poc: req.body?.poc,
    type: req.body?.type,
    createdAt,
  };

  applications.push(application);
  res.status(201).json(application);
});

app.get('/api/applications/:id', (req, res) => {
  const application = applications.find((item) => item.id === req.params.id);
  if (!application) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }
  res.json(application);
});

app.patch('/api/applications/:id', (req, res) => {
  const application = applications.find((item) => item.id === req.params.id);
  if (!application) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  Object.assign(application, {
    name: cleanString(req.body?.name) ?? application.name,
    description: cleanString(req.body?.description) ?? application.description,
    poc: req.body?.poc ?? application.poc,
    type: req.body?.type ?? application.type,
    updatedAt: now(),
  });

  res.json(application);
});

app.delete('/api/applications/:id', (req, res) => {
  const index = applications.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  res.json(applications.splice(index, 1)[0]);
});

app.get('/api/requirements', (req, res) => {
  const page = clampNumber(Number(req.query['page'] ?? 1), 1, 100000);
  const pageSize = clampNumber(Number(req.query['pageSize'] ?? 25), 1, 100);
  const q = String(req.query['q'] ?? '').trim().toLowerCase();
  const tag = String(req.query['tag'] ?? '').trim().toLowerCase();
  const status = String(req.query['status'] ?? '') as RequirementStatus | '';
  const priority = String(req.query['priority'] ?? '') as RequirementPriority | '';
  const applicationId = String(req.query['applicationId'] ?? '');
  const ownerId = String(req.query['ownerId'] ?? '');

  const filtered = requirements
    .filter((requirement) => !applicationId || requirement.applicationId === applicationId)
    .filter((requirement) => !status || requirement.status === status)
    .filter((requirement) => !priority || requirement.priority === priority)
    .filter((requirement) => !ownerId || requirement.ownerId === ownerId)
    .filter((requirement) => !tag || requirement.tags.includes(tag))
    .filter((requirement) => !q || searchableText(requirement).includes(q))
    .sort((a, b) => Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt));

  const start = (page - 1) * pageSize;

  res.json({
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  });
});

app.post('/api/requirements', (req, res) => {
  const validationError = validateRequirementPayload(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const createdAt = now();
  const requirement: Requirement = {
    id: nextId('req'),
    applicationId: req.body.applicationId,
    title: cleanString(req.body.title) ?? '',
    description: cleanString(req.body.description),
    status: req.body.status ?? 'draft',
    priority: req.body.priority ?? 'med',
    type: req.body.type ?? 'feature',
    ownerId: cleanString(req.body.ownerId),
    assignees: normalizeTextArray(req.body.assignees),
    tags: normalizeTagArray(req.body.tags),
    estimate: normalizeEstimate(req.body.estimate),
    acceptanceCriteria: normalizeTextArray(req.body.acceptanceCriteria),
    attachments: [],
    lastUpdatedBy: systemUserId,
    createdAt,
    updatedAt: createdAt,
  };

  requirements.push(requirement);
  syncTags(requirement.tags);
  writeAudit(requirement, 'create', undefined, 'Requirement created.');
  res.status(201).json(requirement);
});

app.get('/api/requirements/:id', (req, res) => {
  const requirement = findRequirement(req.params.id);
  if (!requirement) {
    res.status(404).json({ error: 'Requirement not found.' });
    return;
  }
  res.json(requirement);
});

app.patch('/api/requirements/:id', (req, res) => {
  const requirement = findRequirement(req.params.id);
  if (!requirement) {
    res.status(404).json({ error: 'Requirement not found.' });
    return;
  }

  const nextRequirement = mergeRequirement(requirement, req.body);
  const validationError = validateRequirementPayload(nextRequirement, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const previous = { ...requirement, tags: [...requirement.tags], assignees: [...requirement.assignees] };
  Object.assign(requirement, nextRequirement, { updatedAt: now(), lastUpdatedBy: systemUserId });
  syncTags(requirement.tags);

  const changeType = previous.status !== requirement.status ? 'status_change' : 'update';
  writeAudit(requirement, changeType, diffRequirement(previous, requirement));

  res.json(requirement);
});

app.delete('/api/requirements/:id', (req, res) => {
  const requirement = findRequirement(req.params.id);
  if (!requirement) {
    res.status(404).json({ error: 'Requirement not found.' });
    return;
  }

  const previousStatus = requirement.status;
  requirement.status = 'archived';
  requirement.updatedAt = now();
  requirement.lastUpdatedBy = systemUserId;
  writeAudit(requirement, 'delete', { status: { from: previousStatus, to: 'archived' } }, 'Requirement archived.');
  res.json(requirement);
});

app.post('/api/requirements/:id/attachments', (req, res) => {
  const requirement = findRequirement(req.params.id);
  if (!requirement) {
    res.status(404).json({ error: 'Requirement not found.' });
    return;
  }

  const name = cleanString(req.body?.name);
  const url = cleanString(req.body?.url);
  if (!name || !url) {
    res.status(400).json({ error: 'Attachment name and URL are required.' });
    return;
  }

  requirement.attachments.push({
    name,
    url,
    uploadedBy: cleanString(req.body?.uploadedBy) ?? systemUserId,
    createdAt: now(),
  });
  requirement.updatedAt = now();
  writeAudit(requirement, 'comment', { attachments: { to: requirement.attachments.length } }, 'Attachment added.');
  res.status(201).json(requirement);
});

app.get('/api/requirements/:id/audit', (req, res) => {
  res.json(
    auditEntries
      .filter((entry) => entry.requirementId === req.params.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  );
});

app.get('/api/tags', (_req, res) => {
  res.json([...tags].sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/tags', (req, res) => {
  const name = String(req.body?.name ?? '').trim().toLowerCase();
  if (!name) {
    res.status(400).json({ error: 'Tag name is required.' });
    return;
  }

  const existingTag = tags.find((tag) => tag.name === name);
  if (existingTag) {
    res.status(409).json({ error: 'Tag already exists.' });
    return;
  }

  const tag: Tag = {
    id: nextId('tag'),
    name,
    color: cleanString(req.body?.color),
    createdBy: systemUserId,
    createdAt: now(),
  };
  tags.push(tag);
  res.status(201).json(tag);
});

app.get('/api/users', (_req, res) => {
  res.json(users.filter((user) => user.active).sort((a, b) => a.name.localeCompare(b.name)));
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

function now(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => cleanString(item)).filter(Boolean))] as string[];
}

function normalizeTagArray(value: unknown): string[] {
  return normalizeTextArray(value).map((tag) => tag.toLowerCase());
}

function normalizeEstimate(value: unknown): Requirement['estimate'] {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const estimate = value as { points?: unknown; hours?: unknown };
  const points = typeof estimate.points === 'number' && estimate.points >= 0 ? estimate.points : undefined;
  const hours = typeof estimate.hours === 'number' && estimate.hours >= 0 ? estimate.hours : undefined;

  if (points === undefined && hours === undefined) {
    return undefined;
  }

  return { points, hours };
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

function searchableText(requirement: Requirement): string {
  return [
    requirement.title,
    requirement.description,
    requirement.status,
    requirement.priority,
    requirement.type,
    requirement.tags.join(' '),
    requirement.acceptanceCriteria.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function findRequirement(id: string): Requirement | undefined {
  return requirements.find((requirement) => requirement.id === id);
}

function validateRequirementPayload(value: Partial<Requirement>, partial = false): string | undefined {
  if (!partial && !applications.some((application) => application.id === value.applicationId)) {
    return 'A valid applicationId is required.';
  }

  if (!partial && !cleanString(value.title)) {
    return 'Title is required.';
  }

  if (value.status === 'approved' && !normalizeTextArray(value.acceptanceCriteria).length) {
    return 'At least one acceptance criterion is required before approval.';
  }

  if (value.status === 'in-progress' && !cleanString(value.ownerId)) {
    return 'An owner is required before work can move in-progress.';
  }

  return undefined;
}

function mergeRequirement(requirement: Requirement, body: Partial<Requirement>): Requirement {
  return {
    ...requirement,
    title: cleanString(body.title) ?? requirement.title,
    description: cleanString(body.description) ?? requirement.description,
    status: body.status ?? requirement.status,
    priority: body.priority ?? requirement.priority,
    type: body.type ?? requirement.type,
    ownerId: cleanString(body.ownerId) ?? requirement.ownerId,
    assignees: Array.isArray(body.assignees) ? normalizeTextArray(body.assignees) : requirement.assignees,
    tags: Array.isArray(body.tags) ? normalizeTagArray(body.tags) : requirement.tags,
    estimate: body.estimate ? normalizeEstimate(body.estimate) : requirement.estimate,
    acceptanceCriteria: Array.isArray(body.acceptanceCriteria)
      ? normalizeTextArray(body.acceptanceCriteria)
      : requirement.acceptanceCriteria,
  };
}

function syncTags(tagNames: string[]): void {
  tagNames.forEach((name) => {
    if (!tags.some((tag) => tag.name === name)) {
      tags.push({ id: nextId('tag'), name, createdBy: systemUserId, createdAt: now() });
    }
  });
}

function writeAudit(
  requirement: Requirement,
  changeType: RequirementAuditChangeType,
  diff?: Record<string, unknown>,
  note?: string,
): void {
  auditEntries.push({
    id: nextId('aud'),
    requirementId: requirement.id,
    applicationId: requirement.applicationId,
    changeType,
    changedBy: systemUserId,
    diff,
    note,
    createdAt: now(),
  });
}

function diffRequirement(before: Requirement, after: Requirement): Record<string, unknown> {
  const diff: Record<string, unknown> = {};
  const fields: (keyof Requirement)[] = [
    'title',
    'description',
    'status',
    'priority',
    'type',
    'ownerId',
    'assignees',
    'tags',
    'estimate',
    'acceptanceCriteria',
  ];

  fields.forEach((field) => {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      diff[field] = { from: before[field], to: after[field] };
    }
  });

  return diff;
}
