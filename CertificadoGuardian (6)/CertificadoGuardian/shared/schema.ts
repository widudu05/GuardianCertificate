import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // Roles: system_admin (admin do SaaS), org_admin (admin da organização), company_admin (admin da empresa), user (usuário comum)
  role: text("role").notNull().default("user"),
  organizationId: integer("organization_id").references(() => organizations.id), // Usuário pertence a uma organização
  defaultCompanyId: integer("default_company_id"), // Empresa padrão do usuário
  status: text("status").notNull().default("active"), // active, inactive, suspended
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  loginAttempts: integer("login_attempts").default(0),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  mustChangePassword: boolean("must_change_password").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
  defaultCompanyId: true,
  status: true,
  twoFactorEnabled: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Organizations (tenants)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(), // CNPJ da organização
  domain: text("domain"), // Domínio opcional para subdomain routing
  status: text("status").notNull().default("active"), // active, inactive, suspended
  plan: text("plan").notNull().default("basic"), // basic, premium, enterprise
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  identifier: true,
  domain: true,
  plan: true,
  status: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(), // CNPJ
  organizationId: integer("organization_id").notNull().references(() => organizations.id), // Empresa pertence a uma organização
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  identifier: true,
  organizationId: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  entity: text("entity").notNull(),
  identifier: text("identifier").notNull(), // CNPJ/CPF
  type: text("type").notNull(), // A1 or A3
  issuedDate: timestamp("issued_date").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  password: text("password").notNull(), // Encrypted password
  certificateFile: text("certificate_file"), // Path to file (A1)
  systems: jsonb("systems").notNull().default([]), // Array of systems that use this certificate
  notes: text("notes"),
  companyId: integer("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by").notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  name: true,
  entity: true,
  identifier: true,
  type: true,
  issuedDate: true,
  expirationDate: true,
  password: true,
  certificateFile: true,
  systems: true,
  notes: true,
  companyId: true,
  createdBy: true,
  updatedBy: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Certificate Systems
export const certificateSystems = pgTable("certificate_systems", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  purpose: text("purpose"),
});

export const insertCertificateSystemSchema = createInsertSchema(certificateSystems).pick({
  certificateId: true,
  name: true,
  url: true,
  purpose: true,
});

export type InsertCertificateSystem = z.infer<typeof insertCertificateSystemSchema>;
export type CertificateSystem = typeof certificateSystems.$inferSelect;

// User Organization Memberships - relacionamento entre usuários e organizações
export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("member"), // owner, admin, member
  invitedBy: integer("invited_by"),
  inviteAccepted: boolean("invite_accepted").default(true),
  inviteToken: text("invite_token"),
  inviteExpires: timestamp("invite_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  userId: true,
  organizationId: true,
  role: true,
  invitedBy: true,
  inviteAccepted: true,
  inviteToken: true,
  inviteExpires: true,
});

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

// User Company Permissions - permissões do usuário para cada empresa
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  viewPermission: boolean("view_permission").notNull().default(true),
  editPermission: boolean("edit_permission").notNull().default(false),
  deletePermission: boolean("delete_permission").notNull().default(false),
  viewPasswordPermission: boolean("view_password_permission").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).pick({
  userId: true,
  companyId: true,
  viewPermission: true,
  editPermission: true,
  deletePermission: true,
  viewPasswordPermission: true,
});

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  organizationId: integer("organization_id"),
  companyId: integer("company_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(), // 'certificate', 'user', 'company', 'organization', 'system'
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  organizationId: true,
  companyId: true,
  action: true,
  entity: true,
  entityId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Security Logs (específico para eventos de segurança como login, alteração de senha, etc)
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  organizationId: integer("organization_id"),
  eventType: text("event_type").notNull(), // login, logout, reset_password, change_password, 2fa_enabled, etc
  status: text("status").notNull(), // success, failure
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).pick({
  userId: true,
  organizationId: true,
  eventType: true,
  status: true,
  ipAddress: true,
  userAgent: true,
  details: true,
});

export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;

// Organization Settings
export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  passwordPolicy: jsonb("password_policy").default({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiresDays: 90,
    preventReuse: 3
  }),
  twoFactorPolicy: jsonb("two_factor_policy").default({
    required: false,
    requiredForAdmins: true,
    gracePeriodsHours: 24
  }),
  sessionPolicy: jsonb("session_policy").default({
    idleTimeoutMinutes: 30,
    absoluteTimeoutHours: 24,
    rememberMeDays: 30
  }),
  ipRestrictions: jsonb("ip_restrictions").default([]),
  apiSettings: jsonb("api_settings").default({
    enabled: false,
    rateLimits: { perMinute: 60, perHour: 1000 }
  }),
  backupSettings: jsonb("backup_settings").default({
    autoBackupEnabled: true,
    frequency: "daily",
    encryptBackups: true
  }),
  notificationSettings: jsonb("notification_settings").default({
    expiryNotifications: { days: [30, 15, 7, 1] },
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).pick({
  organizationId: true,
  passwordPolicy: true,
  twoFactorPolicy: true,
  sessionPolicy: true,
  ipRestrictions: true,
  apiSettings: true,
  backupSettings: true,
  notificationSettings: true,
});

export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
