import { Request, Response } from "express";
import { Application } from "../models/application.model";

export async function listApplications(req: Request, res: Response) {
  const apps = await Application.find().sort({ createdAt: -1 }).lean();
  const mapped = apps.map((a: any) => ({
    id: a._id.toString(),
    key: a.key,
    name: a.name,
    description: a.description,
    poc: a.poc,
    type: a.type,
    createdAt: a.createdAt?.toISOString(),
    updatedAt: a.updatedAt?.toISOString(),
  }));
  res.json(mapped);
}

export async function createApplication(req: Request, res: Response) {
  const payload = req.body;
  const app = new Application(payload);
  await app.save();
  const a: any = app.toObject();
  res.status(201).json({ id: a._id.toString(), ...a, createdAt: a.createdAt?.toISOString(), updatedAt: a.updatedAt?.toISOString() });
}

export async function getApplication(req: Request, res: Response) {
  const app = await Application.findById(req.params.id).lean();
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json({ id: app._id.toString(), key: app.key, name: app.name, description: app.description, poc: app.poc, type: app.type, createdAt: app.createdAt?.toISOString(), updatedAt: app.updatedAt?.toISOString() });
}

export async function updateApplication(req: Request, res: Response) {
  const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json({ id: app._id.toString(), key: app.key, name: app.name, description: app.description, poc: app.poc, type: app.type, createdAt: app.createdAt?.toISOString(), updatedAt: app.updatedAt?.toISOString() });
}

export async function deleteApplication(req: Request, res: Response) {
  await Application.findByIdAndDelete(req.params.id);
  res.status(204).end();
}
