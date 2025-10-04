import { pgTable, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  autoAssignClients: boolean('auto_assign_clients').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const resources = pgTable('resources', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  type: text('type').notNull(),
  segment: text('segment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userManagers = pgTable('user_managers', {
  userId: text('user_id').notNull(),
  managerId: text('manager_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.managerId] }),
]);

export const teamMembers = pgTable('team_members', {
  teamId: text('team_id').notNull(),
  userId: text('user_id').notNull(),
  accessType: text('access_type').notNull(),
  grantedVia: text('granted_via'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.teamId, t.userId] }),
]);

export const teamResources = pgTable('team_resources', {
  teamId: text('team_id').notNull(),
  resourceId: text('resource_id').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.teamId, t.resourceId] }),
]);


