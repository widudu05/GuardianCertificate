import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'user']);
export const certificateTypeEnum = pgEnum('certificate_type', ['A1', 'A3']);
export const activityActionEnum = pgEnum('activity_action', ['login', 'logout', 'view', 'create', 'update', 'delete', 'view_password']);
export const activityEntityEnum = pgEnum('activity_entity', ['user', 'company', 'certificate', 'system']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
  activities: many(activityLogs),
}));

// Companies table
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  identifier: text('identifier').notNull().unique(), // CNPJ/CPF
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  certificates: many(certificates),
  permissions: many(userPermissions),
}));

// Certificates table
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  entity: text('entity').notNull(),
  identifier: text('identifier').notNull(), // CPF/CNPJ
  type: certificateTypeEnum('type').notNull(),
  issuedDate: timestamp('issued_date').notNull(),
  expirationDate: timestamp('expiration_date').notNull(),
  password: text('password').notNull(), // Encrypted
  filePath: text('file_path'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  company: one(companies, {
    fields: [certificates.companyId],
    references: [companies.id],
  }),
  systems: many(certificateSystems),
}));

// Certificate Systems table
export const certificateSystems = pgTable('certificate_systems', {
  id: serial('id').primaryKey(),
  certificateId: integer('certificate_id').notNull().references(() => certificates.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  url: text('url'),
  description: text('description'),
});

export const certificateSystemsRelations = relations(certificateSystems, ({ one }) => ({
  certificate: one(certificates, {
    fields: [certificateSystems.certificateId],
    references: [certificates.id],
  }),
}));

// User Permissions table
export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  companyId: integer('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  view: boolean('view').notNull().default(true),
  edit: boolean('edit').notNull().default(false),
  delete: boolean('delete').notNull().default(false),
  viewPassword: boolean('view_password').notNull().default(false),
});

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userPermissions.companyId],
    references: [companies.id],
  }),
}));

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  action: activityActionEnum('action').notNull(),
  entity: activityEntityEnum('entity').notNull(),
  entityId: integer('entity_id'),
  details: json('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: text('ip_address'),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    email: z.string().email("Email inválido"),
  });

export const insertCompanySchema = createInsertSchema(companies)
  .omit({ id: true, createdAt: true })
  .extend({
    identifier: z.string().min(11, "CPF/CNPJ inválido"),
  });

export const insertCertificateSchema = createInsertSchema(certificates)
  .omit({ id: true, createdAt: true })
  .extend({
    issuedDate: z.string().or(z.date()),
    expirationDate: z.string().or(z.date()),
  });

export const insertCertificateSystemSchema = createInsertSchema(certificateSystems)
  .omit({ id: true });

export const insertUserPermissionSchema = createInsertSchema(userPermissions)
  .omit({ id: true });

export const insertActivityLogSchema = createInsertSchema(activityLogs)
  .omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type CertificateSystem = typeof certificateSystems.$inferSelect;
export type InsertCertificateSystem = z.infer<typeof insertCertificateSystemSchema>;

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
