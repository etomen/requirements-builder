import { Request, Response } from "express";
import { Requirement } from "../models/requirement.model";
import { RequirementAudit } from "../models/audit.model";

export async function listRequirements(req: Request, res: Response) {
  const { applicationId, status, q, tag, page = '1', pageSize = '25', ownerId, priority } = req.query as any;
  const filter: any = {};
  if (applicationId) filter.applicationId = applicationId;
  if (status) filter.status = status;
  if (ownerId) filter.ownerId = ownerId;
  if (priority) filter.priority = priority;

  // Support tag as single value or comma-separated list
  if (tag) {
    const tags = String(tag).split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 1) filter.tags = tags[0];
    else filter.tags = { $all: tags };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(500, parseInt(pageSize, 10) || 25));

  const baseQuery = q ? { $text: { $search: q }, ...filter } : filter;
  const total = await Requirement.countDocuments(baseQuery);
  const items = await Requirement.find(baseQuery).sort({ updatedAt: -1 }).skip((pageNum - 1) * size).limit(size).lean();

  const mapped = items.map((r: any) => ({
    id: r._id.toString(),
    applicationId: r.applicationId?.toString(),
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    type: r.type,
    ownerId: r.ownerId?.toString(),
    assignees: (r.assignees || []).map((a: any) => a.toString()),
    tags: r.tags || [],
    estimate: r.estimate || {},
    acceptanceCriteria: r.acceptanceCriteria || [],
    attachments: r.attachments || [],
    lastUpdatedBy: r.lastUpdatedBy?.toString(),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  }));

  res.json({ items: mapped, total, page: pageNum, pageSize: size });
}

export async function createRequirement(req: Request, res: Response) {
  const payload = req.body;
  const doc = new Requirement(payload);
  await doc.save();
  await RequirementAudit.create({ requirementId: doc._id, applicationId: doc.applicationId, changeType: 'create', changedBy: req.body.createdBy });
  const d: any = doc.toObject();
  res.status(201).json({ id: d._id.toString(), applicationId: d.applicationId?.toString(), title: d.title, description: d.description, status: d.status, priority: d.priority, type: d.type, ownerId: d.ownerId?.toString(), assignees: (d.assignees||[]).map((a: any)=>a.toString()), tags: d.tags||[], estimate: d.estimate||{}, acceptanceCriteria: d.acceptanceCriteria||[], attachments: d.attachments||[], lastUpdatedBy: d.lastUpdatedBy?.toString(), createdAt: d.createdAt?.toISOString(), updatedAt: d.updatedAt?.toISOString() });
}

export async function getRequirement(req: Request, res: Response) {
  const doc = await Requirement.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc._id.toString(), applicationId: doc.applicationId?.toString(), title: doc.title, description: doc.description, status: doc.status, priority: doc.priority, type: doc.type, ownerId: doc.ownerId?.toString(), assignees: (doc.assignees||[]).map((a:any)=>a.toString()), tags: doc.tags||[], estimate: doc.estimate||{}, acceptanceCriteria: doc.acceptanceCriteria||[], attachments: doc.attachments||[], lastUpdatedBy: doc.lastUpdatedBy?.toString(), createdAt: doc.createdAt?.toISOString(), updatedAt: doc.updatedAt?.toISOString() });
}

export async function updateRequirement(req: Request, res: Response) {
  const update = req.body;
  const doc = await Requirement.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  await RequirementAudit.create({ requirementId: doc._id, applicationId: doc.applicationId, changeType: 'update', changedBy: req.body.updatedBy, diff: update });
  const d: any = doc.toObject();
  res.json({ id: d._id.toString(), applicationId: d.applicationId?.toString(), title: d.title, description: d.description, status: d.status, priority: d.priority, type: d.type, ownerId: d.ownerId?.toString(), assignees: (d.assignees||[]).map((a:any)=>a.toString()), tags: d.tags||[], estimate: d.estimate||{}, acceptanceCriteria: d.acceptanceCriteria||[], attachments: d.attachments||[], lastUpdatedBy: d.lastUpdatedBy?.toString(), createdAt: d.createdAt?.toISOString(), updatedAt: d.updatedAt?.toISOString() });
}

export async function deleteRequirement(req: Request, res: Response) {
  await Requirement.findByIdAndDelete(req.params.id);
  await RequirementAudit.create({ requirementId: req.params.id as any, changeType: 'delete', changedBy: req.body.deletedBy });
  res.status(204).end();
}

export async function listAudit(req: Request, res: Response) {
  const entries = await RequirementAudit.find({ requirementId: req.params.id }).sort({ createdAt: -1 }).lean();
  const mapped = entries.map((e: any) => ({ id: e._id.toString(), requirementId: e.requirementId?.toString(), applicationId: e.applicationId?.toString(), changeType: e.changeType, changedBy: e.changedBy?.toString(), diff: e.diff, note: e.note, createdAt: e.createdAt?.toISOString() }));
  res.json(mapped);
}
