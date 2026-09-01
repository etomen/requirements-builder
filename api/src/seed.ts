import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Application } from './models/application.model';
import { User } from './models/user.model';
import { Tag } from './models/tag.model';
import { Requirement } from './models/requirement.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/requirements_builder';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);

  // Applications
  const appsData = [
    { key: 'billing-service', name: 'Billing Service', description: 'Handles billing and invoices', type: 'internal', poc: { name: 'Alice', email: 'alice@example.com' } },
    { key: 'portal', name: 'Customer Portal', description: 'Customer-facing portal', type: 'external', poc: { name: 'Bob', email: 'bob@example.com' } },
  ];

  const apps: any[] = [];
  for (const a of appsData) {
    const existing = await Application.findOne({ key: a.key });
    if (existing) apps.push(existing);
    else apps.push(await Application.create(a));
  }

  // Users
  const usersData = [
    { name: 'Alice', email: 'alice@example.com', role: 'owner' },
    { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    { name: 'Carol', email: 'carol@example.com', role: 'viewer' },
  ];
  const users: any[] = [];
  for (const u of usersData) {
    const existing = await User.findOne({ email: u.email });
    if (existing) users.push(existing);
    else users.push(await User.create(u));
  }

  // Tags
  const tagsData = [
    { name: 'payments', color: '#e57373' },
    { name: 'ui', color: '#64b5f6' },
    { name: 'security', color: '#81c784' },
  ];
  const tags: any[] = [];
  for (const t of tagsData) {
    const existing = await Tag.findOne({ name: t.name });
    if (existing) tags.push(existing);
    else tags.push(await Tag.create(t));
  }

  // Requirements (sample)
  const reqsData = [
    {
      applicationId: apps[0]._id,
      title: 'Add invoice export',
      description: 'Allow exporting invoices as CSV',
      status: 'proposed',
      priority: 'high',
      type: 'feature',
      ownerId: users[0]._id,
      assignees: [users[1]._id],
      tags: ['payments'],
    },
    {
      applicationId: apps[1]._id,
      title: 'Improve login UX',
      description: 'Simplify the login flow for customers',
      status: 'in-progress',
      priority: 'med',
      type: 'feature',
      ownerId: users[1]._id,
      assignees: [users[2]._id],
      tags: ['ui'],
    },
  ];

  for (const r of reqsData) {
    const existing = await Requirement.findOne({ applicationId: r.applicationId, title: r.title });
    if (!existing) await Requirement.create(r);
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed error', err);
  process.exit(1);
});
