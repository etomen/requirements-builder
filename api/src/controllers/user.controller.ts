import { Request, Response } from "express";
import { User } from "../models/user.model";

export async function listUsers(req: Request, res: Response) {
  const users = await User.find().sort({ name: 1 }).lean();
  const mapped = users.map((u: any) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString(),
  }));
  res.json(mapped);
}

export async function createUser(req: Request, res: Response) {
  const payload = req.body;
  const user = new User(payload);
  await user.save();
  const u: any = user.toObject();
  res.status(201).json({ id: u._id.toString(), name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt?.toISOString(), updatedAt: u.updatedAt?.toISOString() });
}

export async function getUser(req: Request, res: Response) {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt?.toISOString(), updatedAt: user.updatedAt?.toISOString() });
}

export async function updateUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt?.toISOString(), updatedAt: user.updatedAt?.toISOString() });
}

export async function deleteUser(req: Request, res: Response) {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).end();
}
