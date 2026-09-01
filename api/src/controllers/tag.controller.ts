import { Request, Response } from "express";
import { Tag } from "../models/tag.model";

export async function listTags(req: Request, res: Response) {
  const tags = await Tag.find().sort({ name: 1 }).lean();
  const mapped = tags.map((t: any) => ({
    id: t._id.toString(),
    name: t.name,
    color: t.color,
    createdBy: t.createdBy,
    createdAt: t.createdAt?.toISOString(),
  }));
  res.json(mapped);
}

export async function createTag(req: Request, res: Response) {
  const payload = req.body;
  const tag = new Tag(payload);
  await tag.save();
  const t: any = tag.toObject();
  res.status(201).json({ id: t._id.toString(), name: t.name, color: t.color, createdBy: t.createdBy, createdAt: t.createdAt?.toISOString() });
}

export async function getTag(req: Request, res: Response) {
  const tag = await Tag.findById(req.params.id).lean();
  if (!tag) return res.status(404).json({ error: 'Not found' });
  res.json({ id: tag._id.toString(), name: tag.name, color: tag.color, createdBy: tag.createdBy, createdAt: tag.createdAt?.toISOString() });
}

export async function updateTag(req: Request, res: Response) {
  const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!tag) return res.status(404).json({ error: 'Not found' });
  res.json({ id: tag._id.toString(), name: tag.name, color: tag.color, createdBy: tag.createdBy, createdAt: tag.createdAt?.toISOString(), updatedAt: tag.updatedAt?.toISOString() });
}

export async function deleteTag(req: Request, res: Response) {
  await Tag.findByIdAndDelete(req.params.id);
  res.status(204).end();
}
