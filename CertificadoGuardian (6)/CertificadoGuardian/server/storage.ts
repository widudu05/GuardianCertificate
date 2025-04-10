import {
  User,
  InsertUser,
  Organization,
  InsertOrganization,
  Company,
  InsertCompany,
  Certificate,
  InsertCertificate,
  CertificateSystem,
  InsertCertificateSystem,
  OrganizationMember,
  InsertOrganizationMember,
  UserPermission,
  InsertUserPermission,
  ActivityLog,
  InsertActivityLog,
  SecurityLog,
  InsertSecurityLog,
  OrganizationSettings,
  InsertOrganizationSettings,
  users,
  organizations,
  companies,
  certificates,
  certificateSystems,
  organizationMembers,
  userPermissions,
  activityLogs,
  securityLogs,
  organizationSettings
} from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db, pool, sql } from "./db";
import { and, eq, desc, or, inArray } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Use PostgreSQL for session store
const PgSessionStore = connectPgSimple(session);

// Create scrypt async function
const scryptAsync = promisify(scrypt);

// For password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Interface for storage operations
export interface IStorage {
  // Organizations (tenants)
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByIdentifier(identifier: string): Promise<Organization | undefined>;
  getOrganizationByDomain(domain: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<Organization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;
  
  // Organization Settings
  getOrganizationSettings(organizationId: number): Promise<OrganizationSettings | undefined>;
  createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings>;
  updateOrganizationSettings(id: number, settings: Partial<OrganizationSettings>): Promise<OrganizationSettings | undefined>;
  
  // Organization Members
  getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]>;
  getOrganizationMember(userId: number, organizationId: number): Promise<OrganizationMember | undefined>;
  createOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  updateOrganizationMember(id: number, member: Partial<OrganizationMember>): Promise<OrganizationMember | undefined>;
  deleteOrganizationMember(id: number): Promise<boolean>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  incrementLoginAttempts(userId: number): Promise<number>;
  resetLoginAttempts(userId: number): Promise<void>;
  updateLastLogin(userId: number, ipAddress: string): Promise<void>;

  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByIdentifier(identifier: string): Promise<Company | undefined>;
  getCompaniesByUser(userId: number): Promise<Company[]>;
  getCompaniesByOrganization(organizationId: number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Certificates
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificatesByCompany(companyId: number): Promise<Certificate[]>;
  getCertificatesByStatus(companyId: number, status: string): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, certificate: Partial<Certificate>): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<boolean>;
  
  // Certificate Systems
  getCertificateSystems(certificateId: number): Promise<CertificateSystem[]>;
  createCertificateSystem(system: InsertCertificateSystem): Promise<CertificateSystem>;
  updateCertificateSystem(id: number, system: Partial<CertificateSystem>): Promise<CertificateSystem | undefined>;
  deleteCertificateSystem(id: number): Promise<boolean>;

  // User Permissions
  getUserPermissions(userId: number, companyId: number): Promise<UserPermission | undefined>;
  getUserPermissionsByOrganization(userId: number, organizationId: number): Promise<UserPermission[]>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(id: number, permission: Partial<UserPermission>): Promise<UserPermission | undefined>;
  deleteUserPermission(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLogs(filters?: { 
    userId?: number, 
    organizationId?: number,
    companyId?: number,
    entity?: string, 
    entityId?: number 
  }): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Security Logs
  getSecurityLogs(filters?: {
    userId?: number,
    organizationId?: number,
    eventType?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date
  }): Promise<SecurityLog[]>;
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool, 
      createTableIfMissing: true
    });
    
    // Create test user
    this.initializeTestData();
  }
  
  private async initializeTestData() {
    try {
      // Check if we already have organizations
      const existingOrgs = await db.select().from(organizations).limit(1);
      
      if (existingOrgs.length === 0) {
        // Create test organization (tenant)
        const testOrg = await this.createOrganization({
          name: "Organização Teste S.A.",
          identifier: "11.222.333/0001-44",
          domain: "teste.com.br",
          status: "active",
          plan: "enterprise"
        });
        
        // Create organization settings
        await this.createOrganizationSettings({
          organizationId: testOrg.id,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            expiresDays: 90,
            preventReuse: 3
          },
          twoFactorPolicy: {
            required: false,
            requiredForAdmins: true,
            gracePeriodsHours: 24
          },
          sessionPolicy: {
            idleTimeoutMinutes: 30,
            absoluteTimeoutHours: 24,
            rememberMeDays: 30
          },
          notificationSettings: {
            expiryNotifications: { days: [30, 15, 7, 1] },
            emailNotifications: true,
            smsNotifications: false,
            whatsappNotifications: false
          }
        });

        // Create test user
        const testUser = await this.createUser({
          username: "teste",
          password: await hashPassword("senha123"),
          email: "teste@exemplo.com",
          name: "Usuário de Teste",
          role: "org_admin", // Admin da organização
          organizationId: testOrg.id,
          status: "active"
        });

        // Add user as organization member
        await this.createOrganizationMember({
          userId: testUser.id,
          organizationId: testOrg.id,
          role: "owner"
        });
        
        // Create a test company
        const testCompany = await this.createCompany({
          name: "Empresa Teste Ltda",
          identifier: "12.345.678/0001-90",
          organizationId: testOrg.id
        });
        
        // Set default company for user
        await this.updateUser(testUser.id, {
          defaultCompanyId: testCompany.id
        });
        
        // Create permission for test user in test company
        await this.createUserPermission({
          userId: testUser.id,
          companyId: testCompany.id,
          viewPermission: true,
          editPermission: true,
          deletePermission: true,
          viewPasswordPermission: true
        });
        
        // Create security log for user creation
        await this.createSecurityLog({
          userId: testUser.id,
          organizationId: testOrg.id,
          eventType: "user_created",
          status: "success",
          ipAddress: "127.0.0.1",
          details: {
            method: "system_initialization"
          }
        });
        
        console.log("Test data initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing test data:", error);
    }
  }

  // Organizations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByIdentifier(identifier: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.identifier, identifier));
    return org;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.domain, domain));
    return org;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values({
      ...insertOrg,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return org;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization | undefined> {
    const [updatedOrg] = await db
      .update(organizations)
      .set({
        ...orgData,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrg;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    await db.delete(organizations).where(eq(organizations.id, id));
    return true;
  }

  // Organization Settings
  async getOrganizationSettings(organizationId: number): Promise<OrganizationSettings | undefined> {
    const [settings] = await db.select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId));
    return settings;
  }

  async createOrganizationSettings(insertSettings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    const [settings] = await db.insert(organizationSettings).values({
      ...insertSettings,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return settings;
  }

  async updateOrganizationSettings(id: number, settingsData: Partial<OrganizationSettings>): Promise<OrganizationSettings | undefined> {
    const [updatedSettings] = await db
      .update(organizationSettings)
      .set({
        ...settingsData,
        updatedAt: new Date()
      })
      .where(eq(organizationSettings.id, id))
      .returning();
    return updatedSettings;
  }

  // Organization Members
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }

  async getOrganizationMember(userId: number, organizationId: number): Promise<OrganizationMember | undefined> {
    const [member] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      ));
    return member;
  }

  async createOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const [member] = await db.insert(organizationMembers).values({
      ...insertMember,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return member;
  }

  async updateOrganizationMember(id: number, memberData: Partial<OrganizationMember>): Promise<OrganizationMember | undefined> {
    const [updatedMember] = await db
      .update(organizationMembers)
      .set({
        ...memberData,
        updatedAt: new Date()
      })
      .where(eq(organizationMembers.id, id))
      .returning();
    return updatedMember;
  }

  async deleteOrganizationMember(id: number): Promise<boolean> {
    await db.delete(organizationMembers).where(eq(organizationMembers.id, id));
    return true;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true; // Postgres doesn't return deleted count in a standard way
  }
  
  async incrementLoginAttempts(userId: number): Promise<number> {
    const [user] = await db.select({loginAttempts: users.loginAttempts})
      .from(users)
      .where(eq(users.id, userId));
      
    const currentAttempts = user?.loginAttempts || 0;
    const newAttempts = currentAttempts + 1;
    
    await db.update(users)
      .set({
        loginAttempts: newAttempts,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    return newAttempts;
  }
  
  async resetLoginAttempts(userId: number): Promise<void> {
    await db.update(users)
      .set({
        loginAttempts: 0,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async updateLastLogin(userId: number, ipAddress: string): Promise<void> {
    await db.update(users)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByIdentifier(identifier: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.identifier, identifier));
    return company;
  }

  async getCompaniesByUser(userId: number): Promise<Company[]> {
    // Obter usuário para verificar a organização
    const user = await this.getUser(userId);
    
    if (!user) {
      return [];
    }
    
    // Obter todas as empresas onde o usuário tem permissões
    const permissions = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
    
    if (permissions.length === 0) {
      return [];
    }
    
    const companyIds = permissions.map(p => p.companyId);
    
    // Obter empresas filtrando por organização para garantir isolamento de tenant
    let userCompanies: Company[] = [];
    if (companyIds.length > 0) {
      if (user.organizationId) {
        // Filtrar empresas pela organização do usuário
        userCompanies = await db.select()
          .from(companies)
          .where(
            and(
              inArray(companies.id, companyIds),
              eq(companies.organizationId, user.organizationId)
            )
          );
      } else {
        // Se o usuário não estiver em uma organização, apenas consultar pelos IDs
        userCompanies = await db.select()
          .from(companies)
          .where(inArray(companies.id, companyIds));
      }
    }
    
    return userCompanies;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    await db.delete(companies).where(eq(companies.id, id));
    return true;
  }

  // Certificates
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate;
  }

  async getCertificatesByCompany(companyId: number): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.companyId, companyId));
  }

  async getCertificatesByStatus(companyId: number, status: string): Promise<Certificate[]> {
    const today = new Date();
    const allCertificates = await db.select().from(certificates)
      .where(eq(certificates.companyId, companyId));
    
    return allCertificates.filter(cert => {
      const expirationDate = new Date(cert.expirationDate);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (status === 'valid') {
        return daysUntilExpiration > 30;
      } else if (status === 'expiring') {
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
      } else if (status === 'expired') {
        return daysUntilExpiration <= 0;
      }
      return true;
    });
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db.insert(certificates).values(insertCertificate).returning();
    return certificate;
  }

  async updateCertificate(id: number, certificateData: Partial<Certificate>): Promise<Certificate | undefined> {
    const [updatedCertificate] = await db
      .update(certificates)
      .set({
        ...certificateData,
        updatedAt: new Date()
      })
      .where(eq(certificates.id, id))
      .returning();
    return updatedCertificate;
  }

  async deleteCertificate(id: number): Promise<boolean> {
    await db.delete(certificates).where(eq(certificates.id, id));
    return true;
  }

  // Certificate Systems
  async getCertificateSystems(certificateId: number): Promise<CertificateSystem[]> {
    return await db.select().from(certificateSystems)
      .where(eq(certificateSystems.certificateId, certificateId));
  }

  async createCertificateSystem(insertSystem: InsertCertificateSystem): Promise<CertificateSystem> {
    const [system] = await db.insert(certificateSystems).values(insertSystem).returning();
    return system;
  }

  async updateCertificateSystem(id: number, systemData: Partial<CertificateSystem>): Promise<CertificateSystem | undefined> {
    const [updatedSystem] = await db
      .update(certificateSystems)
      .set(systemData)
      .where(eq(certificateSystems.id, id))
      .returning();
    return updatedSystem;
  }

  async deleteCertificateSystem(id: number): Promise<boolean> {
    await db.delete(certificateSystems).where(eq(certificateSystems.id, id));
    return true;
  }

  // User Permissions
  async getUserPermissions(userId: number, companyId: number): Promise<UserPermission | undefined> {
    const [permission] = await db.select().from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.companyId, companyId)
      ));
    return permission;
  }

  async createUserPermission(insertPermission: InsertUserPermission): Promise<UserPermission> {
    const [permission] = await db.insert(userPermissions).values(insertPermission).returning();
    return permission;
  }

  async updateUserPermission(id: number, permissionData: Partial<UserPermission>): Promise<UserPermission | undefined> {
    const [updatedPermission] = await db
      .update(userPermissions)
      .set(permissionData)
      .where(eq(userPermissions.id, id))
      .returning();
    return updatedPermission;
  }

  async deleteUserPermission(id: number): Promise<boolean> {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
    return true;
  }

  // Companies by Organization
  async getCompaniesByOrganization(organizationId: number): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.organizationId, organizationId));
  }
  
  // User Permissions by Organization
  async getUserPermissionsByOrganization(userId: number, organizationId: number): Promise<UserPermission[]> {
    // Obter todas as empresas desta organização
    const orgCompanies = await this.getCompaniesByOrganization(organizationId);
    
    if (orgCompanies.length === 0) {
      return [];
    }
    
    const companyIds = orgCompanies.map(c => c.id);
    
    // Obter permissões deste usuário para todas as empresas na organização
    if (companyIds.length === 1) {
      // Se houver apenas uma empresa
      return await db.select().from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.companyId, companyIds[0])
        ));
    } else {
      // Se houver múltiplas empresas, usar inArray
      return await db.select().from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          inArray(userPermissions.companyId, companyIds)
        ));
    }
  }

  // Activity Logs
  async getActivityLogs(filters?: { 
    userId?: number, 
    organizationId?: number,
    companyId?: number,
    entity?: string, 
    entityId?: number 
  }): Promise<ActivityLog[]> {
    // Simplify for now - just get all activities
    const logs = await db.select().from(activityLogs);
    
    // Filter in memory for simplicity
    let filteredLogs = logs;
    
    if (filters) {
      if (filters.userId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.organizationId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.organizationId === filters.organizationId);
      }
      
      if (filters.companyId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.companyId === filters.companyId);
      }
      
      if (filters.entity !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.entity === filters.entity);
      }
      
      if (filters.entityId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.entityId === filters.entityId);
      }
    }
    
    // Sort by timestamp
    return filteredLogs.sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA;
    });
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values({
      ...insertLog,
      timestamp: new Date()
    }).returning();
    return log;
  }
  
  // Security Logs
  async getSecurityLogs(filters?: {
    userId?: number,
    organizationId?: number,
    eventType?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date
  }): Promise<SecurityLog[]> {
    const logs = await db.select().from(securityLogs);
    
    // Filter in memory for simplicity
    let filteredLogs = logs;
    
    if (filters) {
      if (filters.userId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.organizationId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.organizationId === filters.organizationId);
      }
      
      if (filters.eventType !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
      }
      
      if (filters.status !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }
      
      if (filters.startDate !== undefined) {
        filteredLogs = filteredLogs.filter(log => {
          const logTimestamp = log.timestamp ? new Date(log.timestamp) : new Date(0);
          return logTimestamp >= filters.startDate!;
        });
      }
      
      if (filters.endDate !== undefined) {
        filteredLogs = filteredLogs.filter(log => {
          const logTimestamp = log.timestamp ? new Date(log.timestamp) : new Date(0);
          return logTimestamp <= filters.endDate!;
        });
      }
    }
    
    // Sort by timestamp
    return filteredLogs.sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA;
    });
  }

  async createSecurityLog(insertLog: InsertSecurityLog): Promise<SecurityLog> {
    const [log] = await db.insert(securityLogs).values({
      ...insertLog,
      timestamp: new Date()
    }).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();