import { 
  users, companies, certificates, userPermissions, activityLogs, certificateSystems,
  type User, type InsertUser, 
  type Company, type InsertCompany,
  type Certificate, type InsertCertificate,
  type UserPermission, type InsertUserPermission,
  type ActivityLog, type InsertActivityLog,
  type CertificateSystem, type InsertCertificateSystem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gte, sql, desc, inArray } from "drizzle-orm";
import { encrypt, decrypt } from "./auth";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  getCompaniesForUser(userId: number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Certificate methods
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateWithPassword(id: number): Promise<Certificate | undefined>;
  getCertificates(filter?: { companyId?: number, expiringOnly?: boolean }): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, certificate: Partial<InsertCertificate>): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<boolean>;

  // Permissions methods
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  getUserPermissionsForCompany(userId: number, companyId: number): Promise<UserPermission | undefined>;
  setUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  removeUserPermission(userId: number, companyId: number): Promise<boolean>;

  // Activity log methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;

  // Certificate systems methods
  getCertificateSystems(certificateId: number): Promise<CertificateSystem[]>;
  createCertificateSystem(system: InsertCertificateSystem): Promise<CertificateSystem>;
  deleteCertificateSystem(id: number): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalCertificates: number;
    expiringCertificates: number;
    a1Certificates: number;
    a3Certificates: number;
  }>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompaniesForUser(userId: number): Promise<Company[]> {
    const userCompanies = await db.select({
      company: companies,
    })
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId))
    .innerJoin(companies, eq(userPermissions.companyId, companies.id));
    
    return userCompanies.map(uc => uc.company);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // Certificate methods
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select({
        ...certificates,
        password: sql`NULL`.as('password'), // Don't return password
      })
      .from(certificates)
      .where(eq(certificates.id, id));
    return certificate;
  }

  async getCertificateWithPassword(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id));
    
    if (certificate) {
      certificate.password = decrypt(certificate.password);
    }
    
    return certificate;
  }

  async getCertificates(filter?: { companyId?: number, expiringOnly?: boolean }): Promise<Certificate[]> {
    let query = db.select({
      ...certificates,
      password: sql`NULL`.as('password'), // Don't return password
    }).from(certificates);
    
    const conditions = [];
    
    if (filter?.companyId) {
      conditions.push(eq(certificates.companyId, filter.companyId));
    }
    
    if (filter?.expiringOnly) {
      // Certificates expiring in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const today = new Date();
      
      conditions.push(lt(certificates.expirationDate, thirtyDaysFromNow));
      conditions.push(gte(certificates.expirationDate, today));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(certificates.expirationDate);
  }

  async createCertificate(cert: InsertCertificate): Promise<Certificate> {
    // Encrypt the password before storing
    const encryptedData = { 
      ...cert,
      password: encrypt(cert.password)
    };
    
    const [certificate] = await db
      .insert(certificates)
      .values(encryptedData)
      .returning({
        ...certificates,
        password: sql`NULL`.as('password'), // Don't return password
      });
    
    return certificate;
  }

  async updateCertificate(id: number, cert: Partial<InsertCertificate>): Promise<Certificate | undefined> {
    // If password is included, encrypt it
    const updateData = { ...cert };
    if (updateData.password) {
      updateData.password = encrypt(updateData.password);
    }
    
    const [certificate] = await db
      .update(certificates)
      .set(updateData)
      .where(eq(certificates.id, id))
      .returning({
        ...certificates,
        password: sql`NULL`.as('password'), // Don't return password
      });
    
    return certificate;
  }

  async deleteCertificate(id: number): Promise<boolean> {
    const result = await db.delete(certificates).where(eq(certificates.id, id));
    return result.rowCount > 0;
  }

  // Permissions methods
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
  }

  async getUserPermissionsForCompany(userId: number, companyId: number): Promise<UserPermission | undefined> {
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.companyId, companyId)
        )
      );
    return permission;
  }

  async setUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    // Check if permission already exists
    const existingPermission = await this.getUserPermissionsForCompany(
      permission.userId,
      permission.companyId
    );
    
    if (existingPermission) {
      // Update existing permission
      const [updated] = await db
        .update(userPermissions)
        .set(permission)
        .where(eq(userPermissions.id, existingPermission.id))
        .returning();
      return updated;
    } else {
      // Create new permission
      const [newPermission] = await db
        .insert(userPermissions)
        .values(permission)
        .returning();
      return newPermission;
    }
  }

  async removeUserPermission(userId: number, companyId: number): Promise<boolean> {
    const result = await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.companyId, companyId)
        )
      );
    return result.rowCount > 0;
  }

  // Activity log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  // Certificate systems methods
  async getCertificateSystems(certificateId: number): Promise<CertificateSystem[]> {
    return await db
      .select()
      .from(certificateSystems)
      .where(eq(certificateSystems.certificateId, certificateId));
  }

  async createCertificateSystem(system: InsertCertificateSystem): Promise<CertificateSystem> {
    const [newSystem] = await db
      .insert(certificateSystems)
      .values(system)
      .returning();
    return newSystem;
  }

  async deleteCertificateSystem(id: number): Promise<boolean> {
    const result = await db
      .delete(certificateSystems)
      .where(eq(certificateSystems.id, id));
    return result.rowCount > 0;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalCertificates: number;
    expiringCertificates: number;
    a1Certificates: number;
    a3Certificates: number;
  }> {
    // Get total certificates
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(certificates);
    
    // Get expiring certificates (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const today = new Date();
    
    const [expiringResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(certificates)
      .where(
        and(
          lt(certificates.expirationDate, thirtyDaysFromNow),
          gte(certificates.expirationDate, today)
        )
      );
    
    // Get A1 certificates
    const [a1Result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(certificates)
      .where(eq(certificates.type, 'A1'));
    
    // Get A3 certificates
    const [a3Result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(certificates)
      .where(eq(certificates.type, 'A3'));
    
    return {
      totalCertificates: totalResult?.count || 0,
      expiringCertificates: expiringResult?.count || 0,
      a1Certificates: a1Result?.count || 0,
      a3Certificates: a3Result?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
