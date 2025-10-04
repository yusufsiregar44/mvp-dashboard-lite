import { pgTable, unique, text, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const teams = pgTable("teams", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	autoAssignClients: boolean("auto_assign_clients").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	segment: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userManagers = pgTable("user_managers", {
	userId: text("user_id").notNull(),
	managerId: text("manager_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.managerId], name: "user_managers_user_id_manager_id_pk"}),
]);

export const teamResources = pgTable("team_resources", {
	teamId: text("team_id").notNull(),
	resourceId: text("resource_id").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.teamId, table.resourceId], name: "team_resources_pkey"}),
]);

export const teamMembers = pgTable("team_members", {
	teamId: text("team_id").notNull(),
	userId: text("user_id").notNull(),
	accessType: text("access_type").notNull(),
	grantedVia: text("granted_via"),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.teamId, table.userId], name: "team_members_pkey"}),
]);
