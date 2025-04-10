import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { setupAuth } from "./auth";
import { encrypt, decrypt } from "./utils";
import { registerAdminRoutes } from "./admin";
import { 
  insertCertificateSchema, 
  insertCompanySchema,
  insertUserPermissionSchema,
  insertOrganizationSchema,
  insertActivityLogSchema,
  insertSecurityLogSchema,
  UserPermission,
  Organization,
  users,
  organizationSettings,
  organizations
} from "@shared/schema";
import { z } from "zod";
import { db, eq } from "./db";

// Extend express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      organizationId?: number;
      organizationRole?: string;
      companyId?: number;
      companyPermissions?: UserPermission;
      session: {
        twoFactorAuthenticated?: boolean;
        currentOrganizationId?: number;
        [key: string]: any;
      }
    }
  }
}

// Configure multer for certificate file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const dir = path.join(process.cwd(), 'uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      // Generate unique filename
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniquePrefix + '-' + file.originalname);
    }
  }),
  fileFilter: function(req, file, cb) {
    // Accept only .pfx files for A1 certificates
    if (file.mimetype === 'application/x-pkcs12' || path.extname(file.originalname) === '.pfx') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only PFX (.pfx) files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve documentation HTML
  app.get('/docs', (req, res) => {
    res.sendFile('documentacao-tecnica.html', { root: '.' });
  });

  // Set up authentication routes
  setupAuth(app);
  
  // Set up admin routes
  registerAdminRoutes(app);

  // Check authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Middleware para verificar se o usuário pertence à organização
  const checkOrganizationAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const organizationId = parseInt(req.params.organizationId || req.query.organizationId as string || '0', 10);
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    try {
      // Verificar se o usuário faz parte da organização
      const orgMember = await storage.getOrganizationMember(req.user.id, organizationId);
      if (!orgMember) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }
      
      // Adiciona dados da organização ao req para uso posterior
      req.organizationId = organizationId;
      req.organizationRole = orgMember.role;
      next();
    } catch (error) {
      console.error("Error checking organization access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Middleware para verificar se o usuário tem acesso à empresa
  const checkCompanyAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const companyId = parseInt(req.params.companyId || req.query.companyId as string || req.body.companyId || '0', 10);
    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }
    
    try {
      // Verificar se o usuário tem permissão para a empresa
      const permission = await storage.getUserPermissions(req.user.id, companyId);
      if (!permission) {
        return res.status(403).json({ message: "Access denied to this company" });
      }
      
      // Verificar se a empresa pertence à mesma organização do usuário
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (user?.organizationId !== company.organizationId) {
        return res.status(403).json({ message: "Company belongs to different organization" });
      }
      
      // Adicionar permissões ao req para uso posterior
      req.companyId = companyId;
      req.companyPermissions = permission;
      next();
    } catch (error) {
      console.error("Error checking company access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Middleware para verificar permissões de visualização de senhas (requer 2FA)
  const checkPasswordViewAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.companyPermissions?.viewPasswordPermission) {
      return res.status(403).json({ message: "No permission to view passwords" });
    }
    
    // Verificar se o usuário tem 2FA habilitado
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Se 2FA estiver habilitado e não houver sessão 2FA, exigir autenticação
    if (user.twoFactorEnabled && !req.session.twoFactorAuthenticated) {
      return res.status(403).json({ 
        message: "Two-factor authentication required", 
        requiresTwoFactor: true 
      });
    }
    
    next();
  };
  
  // Middleware para limitar taxa de requisições (rate limiting)
  const rateLimiter = (maxRequests: number, windowMs: number) => {
    const requests = new Map();
    
    return (req: Request, res: Response, next: Function) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Remover registros antigos
      const userRequests = requests.get(ip) || [];
      const recentRequests = userRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({ 
          message: "Too many requests, please try again later",
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      // Adicionar nova requisição
      recentRequests.push(now);
      requests.set(ip, recentRequests);
      next();
    };
  };
  
  // Aplicar rate limiting global
  app.use(rateLimiter(100, 60 * 1000)); // 100 req por minuto por IP
  
  // Rate limiting mais restritivo para rotas sensíveis
  const sensitiveRoutesLimiter = rateLimiter(20, 60 * 1000); // 20 req por minuto

  // Create activity log
  const logActivity = async (
    userId: number, 
    action: string, 
    entity: string, 
    entityId?: number, 
    details?: string,
    organizationId?: number,
    companyId?: number
  ) => {
    try {
      await storage.createActivityLog({
        userId,
        organizationId,
        companyId,
        action,
        entity,
        entityId,
        details,
        ipAddress: "127.0.0.1", // In a real app, get the actual IP
        userAgent: "Unknown" // In a real app, get from request headers
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };
  
  // Create security log
  const logSecurityEvent = async (
    userId: number,
    eventType: string,
    status: string,
    details: any = {},
    organizationId?: number
  ) => {
    try {
      await storage.createSecurityLog({
        userId,
        organizationId,
        eventType,
        status,
        ipAddress: "127.0.0.1", // In a real app, get the actual IP
        userAgent: "Unknown", // In a real app, get from request headers
        details
      });
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  };

  // GET current user with his companies
  app.get("/api/me", isAuthenticated, async (req, res) => {
    const user = req.user!;
    const companies = await storage.getCompaniesByUser(user.id);
    
    res.status(200).json({
      user,
      companies
    });
  });

  // Company Routes
  app.get("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getCompaniesByUser(req.user!.id);
      res.status(200).json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const data = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(data);
      
      // Create default permission for the creator
      await storage.createUserPermission({
        userId: req.user!.id,
        companyId: company.id,
        viewPermission: true,
        editPermission: true,
        deletePermission: true,
        viewPasswordPermission: true
      });
      
      await logActivity(
        req.user!.id, 
        "create", 
        "company", 
        company.id, 
        `Created company: ${company.name}`
      );
      
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid company data", errors: error.errors });
      } else {
        console.error("Error creating company:", error);
        res.status(500).json({ message: "Failed to create company" });
      }
    }
  });

  // Certificate Routes
  app.get("/api/certificates", isAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const status = req.query.status as string;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      // Check if user has permission to view certificates for this company
      const permission = await storage.getUserPermissions(req.user!.id, companyId);
      if (!permission || !permission.viewPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      let certificates;
      if (status) {
        certificates = await storage.getCertificatesByStatus(companyId, status);
      } else {
        certificates = await storage.getCertificatesByCompany(companyId);
      }
      
      // Don't send the password field
      const sanitizedCertificates = certificates.map(cert => {
        const { password, ...sanitizedCert } = cert;
        return sanitizedCert;
      });
      
      res.status(200).json(sanitizedCertificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post("/api/certificates", isAuthenticated, upload.single('certificateFile'), async (req, res) => {
    try {
      const companyId = parseInt(req.body.companyId);
      
      // Check if user has permission to create certificates for this company
      const permission = await storage.getUserPermissions(req.user!.id, companyId);
      if (!permission || !permission.editPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Encrypt the password
      const encryptedPassword = encrypt(req.body.password);
      
      const certificateData = {
        ...req.body,
        password: encryptedPassword,
        certificateFile: req.file ? req.file.path : undefined,
        systems: JSON.parse(req.body.systems || '[]'),
        issuedDate: new Date(req.body.issuedDate),
        expirationDate: new Date(req.body.expirationDate),
        companyId,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      };
      
      const parsedData = insertCertificateSchema.parse(certificateData);
      const certificate = await storage.createCertificate(parsedData);
      
      await logActivity(
        req.user!.id, 
        "create", 
        "certificate", 
        certificate.id, 
        `Created certificate: ${certificate.name}`
      );
      
      // Remove password from response
      const { password, ...sanitizedCertificate } = certificate;
      
      res.status(201).json(sanitizedCertificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid certificate data", errors: error.errors });
      } else {
        console.error("Error creating certificate:", error);
        res.status(500).json({ message: "Failed to create certificate" });
      }
    }
  });

  app.get("/api/certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has permission to view this certificate
      const permission = await storage.getUserPermissions(req.user!.id, certificate.companyId);
      if (!permission || !permission.viewPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Don't send the password field
      const { password, ...sanitizedCertificate } = certificate;
      
      await logActivity(
        req.user!.id, 
        "view", 
        "certificate", 
        certificate.id, 
        `Viewed certificate: ${certificate.name}`
      );
      
      res.status(200).json(sanitizedCertificate);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  // Get certificate password (requires 2FA in a real app)
  app.post("/api/certificates/:id/password", isAuthenticated, async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Check if user has permission to view the password
      const permission = await storage.getUserPermissions(req.user!.id, certificate.companyId);
      if (!permission || !permission.viewPasswordPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // In a real app, verify 2FA code here
      // const twoFactorCode = req.body.twoFactorCode;
      // if (!verifyTwoFactorCode(twoFactorCode)) {
      //   return res.status(401).json({ message: "Invalid 2FA code" });
      // }
      
      // Decrypt the password
      const decryptedPassword = decrypt(certificate.password);
      
      await logActivity(
        req.user!.id, 
        "view_password", 
        "certificate", 
        certificate.id, 
        `Viewed password for certificate: ${certificate.name}`
      );
      
      res.status(200).json({ password: decryptedPassword });
    } catch (error) {
      console.error("Error fetching certificate password:", error);
      res.status(500).json({ message: "Failed to fetch certificate password" });
    }
  });

  // User Routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Get all users from database - in a real app, use proper pagination
      const allUsers = await db.select().from(users);
      
      // Remove passwords from the response
      const sanitizedUsers = allUsers.map(user => {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get a specific user
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...sanitizedUser } = user;
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update a user
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Never update password this way, use a separate endpoint with proper validation
      const { password, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      await logActivity(
        req.user!.id, 
        "update", 
        "user", 
        userId, 
        `Updated user: ${user.username}`
      );
      
      // Remove password from the response
      const { password: _, ...sanitizedUser } = updatedUser!;
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Update user status
  app.patch("/api/users/:id/status", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'active' or 'inactive'" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { status });
      
      await logActivity(
        req.user!.id, 
        "update_status", 
        "user", 
        userId, 
        `Updated user status: ${user.username} to ${status}`
      );
      
      // Remove password from the response
      const { password, ...sanitizedUser } = updatedUser!;
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  
  // Delete a user
  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = parseInt(req.params.id);
      
      // In a real app, check if this is the only admin and prevent deletion
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      
      await logActivity(
        req.user!.id, 
        "delete", 
        "user", 
        userId, 
        `Deleted user: ${user.username}`
      );
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User Permissions
  app.post("/api/permissions", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const data = insertUserPermissionSchema.parse(req.body);
      const permission = await storage.createUserPermission(data);
      
      await logActivity(
        req.user!.id, 
        "create", 
        "permission", 
        permission.id, 
        `Created permission for user: ${data.userId} in company: ${data.companyId}`
      );
      
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      } else {
        console.error("Error creating permission:", error);
        res.status(500).json({ message: "Failed to create permission" });
      }
    }
  });

  // Activity Logs
  app.get("/api/logs", isAuthenticated, async (req, res) => {
    try {
      // In a real app, limit this to admin users or company admins
      if (req.user!.role !== 'admin' && req.user!.role !== 'org_admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const entity = req.query.entity as string;
      const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId as string) : 
                            req.user!.organizationId;
      
      const logs = await storage.getActivityLogs({ 
        userId, 
        entity, 
        entityId,
        organizationId
      });
      res.status(200).json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  
  // Security Logs (apenas administradores do sistema ou da organização)
  app.get("/api/security-logs", isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário é administrador
      if (req.user!.role !== 'system_admin' && req.user!.role !== 'org_admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const eventType = req.query.eventType as string;
      const status = req.query.status as string;
      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId as string) : 
                            req.user!.organizationId;
      
      // Para administradores de sistema, permitir ver logs de qualquer organização
      // Para administradores de organização, restringir à própria organização
      if (req.user!.role === 'org_admin' && organizationId !== req.user!.organizationId) {
        return res.status(403).json({ message: "Cannot access logs from other organizations" });
      }
      
      const logs = await storage.getSecurityLogs({
        userId,
        eventType,
        status,
        organizationId
      });
      
      res.status(200).json(logs);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      res.status(500).json({ message: "Failed to fetch security logs" });
    }
  });
  
  // Organizations (Tenants)
  
  // Get all organizations (apenas para administradores do sistema)
  app.get("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário é administrador do sistema
      if (req.user!.role !== 'system_admin') {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const allOrganizations = await db.select().from(organizations);
      res.status(200).json(allOrganizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  
  // Get user's current organization
  app.get("/api/my-organization", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      
      if (!organizationId) {
        return res.status(404).json({ message: "No organization found for this user" });
      }
      
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.status(200).json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });
  
  // Create a new organization (tenant)
  app.post("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      // Verificar se o usuário é administrador do sistema ou processo de onboarding
      if (req.user!.role !== 'system_admin' && !req.body.initialSetup) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const data = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(data);
      
      // Se for configuração inicial, associar o usuário atual à organização
      if (req.body.initialSetup) {
        // Atualizar o usuário atual para ser admin da organização
        await storage.updateUser(req.user!.id, {
          organizationId: organization.id,
          role: 'org_admin'
        });
        
        // Adicionar usuário como membro da organização com função de proprietário
        await storage.createOrganizationMember({
          userId: req.user!.id,
          organizationId: organization.id,
          role: 'owner'
        });
        
        // Criar configurações padrão para a organização
        await storage.createOrganizationSettings({
          organizationId: organization.id,
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
      }
      
      await logActivity(
        req.user!.id,
        "create",
        "organization",
        organization.id,
        `Created organization: ${organization.name}`,
        organization.id
      );
      
      // Registrar evento de segurança
      await logSecurityEvent(
        req.user!.id,
        "organization_created",
        "success",
        { organizationName: organization.name },
        organization.id
      );
      
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid organization data", errors: error.errors });
      } else {
        console.error("Error creating organization:", error);
        res.status(500).json({ message: "Failed to create organization" });
      }
    }
  });
  
  // Obter configurações da organização atual do usuário
  app.get("/api/organization-settings", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      
      if (!organizationId) {
        return res.status(404).json({ message: "No organization found for this user" });
      }
      
      const settings = await storage.getOrganizationSettings(organizationId);
      
      if (!settings) {
        return res.status(404).json({ message: "Organization settings not found" });
      }
      
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      res.status(500).json({ message: "Failed to fetch organization settings" });
    }
  });
  
  // Atualizar configurações da organização (requer ser administrador da organização)
  app.patch("/api/organization-settings/:id", isAuthenticated, async (req, res) => {
    try {
      const settingsId = parseInt(req.params.id);
      const settings = await db.select().from(organizationSettings)
        .where(eq(organizationSettings.id, settingsId))
        .limit(1);
      
      if (settings.length === 0) {
        return res.status(404).json({ message: "Organization settings not found" });
      }
      
      const organizationId = settings[0].organizationId;
      
      // Verificar se o usuário pertence à organização e é administrador
      const orgMember = await storage.getOrganizationMember(req.user!.id, organizationId);
      if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'admin')) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const updatedSettings = await storage.updateOrganizationSettings(settingsId, req.body);
      
      await logActivity(
        req.user!.id,
        "update",
        "organization_settings",
        settingsId,
        "Updated organization settings",
        organizationId
      );
      
      res.status(200).json(updatedSettings);
    } catch (error) {
      console.error("Error updating organization settings:", error);
      res.status(500).json({ message: "Failed to update organization settings" });
    }
  });
  
  // Autenticar com verificação em duas etapas
  app.post("/api/verify-2fa", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "2FA code is required" });
      }
      
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "Two-factor authentication is not enabled for this user" });
      }
      
      // Em um aplicativo real, verificar o código com uma biblioteca como 'speakeasy'
      // const verified = speakeasy.totp.verify({
      //   secret: user.twoFactorSecret,
      //   encoding: 'base32',
      //   token: code
      // });
      
      // Para fins de demonstração, aceitar qualquer código
      const verified = true;
      
      if (!verified) {
        await logSecurityEvent(
          user.id,
          "2fa_verification",
          "failure",
          { method: "totp" },
          user.organizationId
        );
        
        return res.status(401).json({ message: "Invalid 2FA code" });
      }
      
      // Marcar a sessão como autenticada com 2FA
      req.session.twoFactorAuthenticated = true;
      
      await logSecurityEvent(
        user.id,
        "2fa_verification",
        "success",
        { method: "totp" },
        user.organizationId
      );
      
      res.status(200).json({ message: "Two-factor authentication successful" });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });
  
  // Alterar empresa atual (dentro da mesma organização)
  app.post("/api/switch-company", isAuthenticated, async (req, res) => {
    try {
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      // Verificar se o usuário tem permissão para a empresa
      const permission = await storage.getUserPermissions(req.user!.id, companyId);
      if (!permission) {
        return res.status(403).json({ message: "Access denied to this company" });
      }
      
      // Verificar se a empresa pertence à mesma organização do usuário
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (user?.organizationId !== company.organizationId) {
        return res.status(403).json({ message: "Company belongs to different organization" });
      }
      
      // Atualizar a empresa padrão do usuário
      await storage.updateUser(req.user!.id, {
        defaultCompanyId: companyId
      });
      
      await logActivity(
        req.user!.id,
        "switch_company",
        "company",
        companyId,
        `Switched to company: ${company.name}`,
        user?.organizationId,
        companyId
      );
      
      res.status(200).json({ message: "Company switched successfully", company });
    } catch (error) {
      console.error("Error switching company:", error);
      res.status(500).json({ message: "Failed to switch company" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
