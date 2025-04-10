import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireCompanyAccess } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCompanySchema, 
  insertCertificateSchema,
  insertUserPermissionSchema,
  insertCertificateSystemSchema,
  userRoleEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  const auth = setupAuth(app);

  // User routes
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't return passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving users", error });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate input
      const updateSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: userRoleEnum.optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const user = await storage.updateUser(userId, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'update',
        entity: 'user',
        entityId: userId,
        details: { updatedFields: Object.keys(validatedData) },
        ipAddress: req.ip,
      });
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating user", error });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (userId === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'delete',
        entity: 'user',
        entityId: userId,
        details: {},
        ipAddress: req.ip,
      });
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  });

  // Company routes
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      let companies;
      
      // Admin can see all companies, others only see their permitted companies
      if (req.user.role === 'admin') {
        companies = await storage.getCompanies();
      } else {
        companies = await storage.getCompaniesForUser(req.user.id);
      }
      
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving companies", error });
    }
  });

  app.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user has access to this company
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(req.user.id, companyId);
        if (!permission || !permission.view) {
          return res.status(403).json({ message: "You don't have access to this company" });
        }
      }
      
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving company", error });
    }
  });

  app.post("/api/companies", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate input
      const validatedData = insertCompanySchema.parse(req.body);
      
      const company = await storage.createCompany(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'create',
        entity: 'company',
        entityId: company.id,
        details: { name: company.name },
        ipAddress: req.ip,
      });
      
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating company", error });
    }
  });

  app.patch("/api/companies/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Validate input
      const updateSchema = z.object({
        name: z.string().optional(),
        identifier: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const company = await storage.updateCompany(companyId, validatedData);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'update',
        entity: 'company',
        entityId: companyId,
        details: { updatedFields: Object.keys(validatedData) },
        ipAddress: req.ip,
      });
      
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating company", error });
    }
  });

  app.delete("/api/companies/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      const success = await storage.deleteCompany(companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'delete',
        entity: 'company',
        entityId: companyId,
        details: {},
        ipAddress: req.ip,
      });
      
      res.status(200).json({ message: "Company deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting company", error });
    }
  });

  // Certificate routes
  app.get("/api/certificates", requireAuth, async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const expiringOnly = req.query.expiringOnly === 'true';
      
      // If company ID specified, check permissions
      if (companyId && req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(req.user.id, companyId);
        if (!permission || !permission.view) {
          return res.status(403).json({ message: "You don't have access to this company's certificates" });
        }
      }
      
      const certificates = await storage.getCertificates({ 
        companyId, 
        expiringOnly 
      });
      
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving certificates", error });
    }
  });

  app.get("/api/certificates/:id", requireAuth, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has access to this certificate's company
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(req.user.id, certificate.companyId);
        if (!permission || !permission.view) {
          return res.status(403).json({ message: "You don't have access to this certificate" });
        }
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'view',
        entity: 'certificate',
        entityId: certificateId,
        details: { certificateName: certificate.name },
        ipAddress: req.ip,
      });
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving certificate", error });
    }
  });

  app.get("/api/certificates/:id/password", requireAuth, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has access to view passwords
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(req.user.id, certificate.companyId);
        if (!permission || !permission.viewPassword) {
          return res.status(403).json({ message: "You don't have permission to view this certificate's password" });
        }
      }
      
      // Verify 2FA code (mocked for now, would integrate with actual 2FA)
      const authCode = req.query.authCode as string;
      if (!authCode || authCode !== '123456') { // In a real app, this would validate against an actual 2FA system
        return res.status(401).json({ message: "Invalid 2FA code" });
      }
      
      const certWithPassword = await storage.getCertificateWithPassword(certificateId);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'view_password',
        entity: 'certificate',
        entityId: certificateId,
        details: { certificateName: certificate.name },
        ipAddress: req.ip,
      });
      
      res.json({ password: certWithPassword?.password });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving certificate password", error });
    }
  });

  app.post("/api/certificates", requireAuth, async (req, res) => {
    try {
      // Validate input
      const validatedData = insertCertificateSchema.parse(req.body);
      
      // Check if user has edit permission for this company
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(
          req.user.id, 
          validatedData.companyId
        );
        
        if (!permission || !permission.edit) {
          return res.status(403).json({ 
            message: "You don't have permission to add certificates to this company" 
          });
        }
      }
      
      const certificate = await storage.createCertificate(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'create',
        entity: 'certificate',
        entityId: certificate.id,
        details: { 
          name: certificate.name,
          company: certificate.companyId 
        },
        ipAddress: req.ip,
      });
      
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating certificate", error });
    }
  });

  app.patch("/api/certificates/:id", requireAuth, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      
      // Get current certificate
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has edit permission
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(
          req.user.id, 
          certificate.companyId
        );
        
        if (!permission || !permission.edit) {
          return res.status(403).json({ 
            message: "You don't have permission to edit this certificate" 
          });
        }
      }
      
      // Validate input
      const updateSchema = insertCertificateSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedCertificate = await storage.updateCertificate(certificateId, validatedData);
      
      if (!updatedCertificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'update',
        entity: 'certificate',
        entityId: certificateId,
        details: { 
          certificateName: certificate.name,
          updatedFields: Object.keys(validatedData) 
        },
        ipAddress: req.ip,
      });
      
      res.json(updatedCertificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating certificate", error });
    }
  });

  app.delete("/api/certificates/:id", requireAuth, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      
      // Get current certificate
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has delete permission
      if (req.user.role !== 'admin') {
        const permission = await storage.getUserPermissionsForCompany(
          req.user.id, 
          certificate.companyId
        );
        
        if (!permission || !permission.delete) {
          return res.status(403).json({ 
            message: "You don't have permission to delete this certificate" 
          });
        }
      }
      
      const success = await storage.deleteCertificate(certificateId);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'delete',
        entity: 'certificate',
        entityId: certificateId,
        details: { certificateName: certificate.name },
        ipAddress: req.ip,
      });
      
      res.status(200).json({ message: "Certificate deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting certificate", error });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving dashboard stats", error });
    }
  });

  // Activity logs
  app.get("/api/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving activity logs", error });
    }
  });

  // User permissions
  app.get("/api/users/:userId/permissions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user permissions", error });
    }
  });

  app.post("/api/permissions", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate input
      const validatedData = insertUserPermissionSchema.parse(req.body);
      
      const permission = await storage.setUserPermission(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'update',
        entity: 'user',
        entityId: validatedData.userId,
        details: { 
          permissionType: 'set',
          companyId: validatedData.companyId
        },
        ipAddress: req.ip,
      });
      
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error setting user permission", error });
    }
  });

  app.delete("/api/permissions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const companyId = parseInt(req.query.companyId as string);
      
      if (!userId || !companyId) {
        return res.status(400).json({ message: "userId and companyId are required" });
      }
      
      const success = await storage.removeUserPermission(userId, companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: 'update',
        entity: 'user',
        entityId: userId,
        details: { 
          permissionType: 'remove',
          companyId: companyId
        },
        ipAddress: req.ip,
      });
      
      res.status(200).json({ message: "Permission removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing user permission", error });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
