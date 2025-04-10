import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "guardian-secret-key-change-in-production";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Estratégia de autenticação local com segurança aprimorada
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Buscar usuário pelo nome de usuário
        const user = await storage.getUserByUsername(username);
        
        // Se usuário não for encontrado, falha na autenticação
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Verificar se a conta do usuário está ativa
        if (user.status === 'inactive') {
          await storage.createSecurityLog({
            userId: user.id,
            organizationId: user.organizationId,
            eventType: "login_attempt",
            status: "failure",
            ipAddress: "127.0.0.1", // Em um app real, pegar do request
            details: { reason: "account_inactive" }
          });
          return done(null, false, { message: "Account is inactive" });
        }
        
        // Verificar se a conta do usuário está bloqueada por muitas tentativas
        if (user.loginAttempts >= 5) { // Limite configurável na organização
          const lastAttempt = user.lastLoginAttempt;
          const now = new Date();
          const timeDiff = lastAttempt ? (now.getTime() - new Date(lastAttempt).getTime()) : 0;
          const lockoutTime = 15 * 60 * 1000; // 15 minutos (configurável na organização)
          
          if (timeDiff < lockoutTime) {
            const remainingMinutes = Math.ceil((lockoutTime - timeDiff) / 60000);
            
            await storage.createSecurityLog({
              userId: user.id,
              organizationId: user.organizationId,
              eventType: "login_attempt",
              status: "failure",
              ipAddress: "127.0.0.1",
              details: { 
                reason: "account_locked",
                remainingLockTime: remainingMinutes
              }
            });
            
            return done(null, false, { 
              message: `Account is locked. Try again in ${remainingMinutes} minute(s).` 
            });
          } else {
            // Resetar contador de tentativas se o tempo de bloqueio passou
            await storage.resetLoginAttempts(user.id);
          }
        }
        
        // Verificar senha
        const passwordValid = await comparePasswords(password, user.password);
        
        if (!passwordValid) {
          // Incrementar contador de tentativas de login
          const attempts = await storage.incrementLoginAttempts(user.id);
          
          await storage.createSecurityLog({
            userId: user.id,
            organizationId: user.organizationId,
            eventType: "login_attempt",
            status: "failure",
            ipAddress: "127.0.0.1",
            details: { 
              reason: "invalid_password",
              attempts
            }
          });
          
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Autenticação bem-sucedida, resetar contador de tentativas
        await storage.resetLoginAttempts(user.id);
        
        // Registrar login bem-sucedido
        await storage.updateLastLogin(user.id, "127.0.0.1");
        
        await storage.createSecurityLog({
          userId: user.id,
          organizationId: user.organizationId,
          eventType: "login",
          status: "success",
          ipAddress: "127.0.0.1",
          details: { method: "password" }
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Extended user schema with additional fields for registration
  const extendedUserSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
    // Campos específicos para registro inicial (criação de organização)
    createOrganization: z.boolean().optional(),
    organizationName: z.string().optional(),
    organizationIdentifier: z.string().optional(),
    organizationDomain: z.string().optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }).refine((data) => {
    // Se estiver criando uma organização, deve fornecer os dados da organização
    if (data.createOrganization) {
      return !!data.organizationName && !!data.organizationIdentifier;
    }
    return true;
  }, {
    message: "Organization data is required when creating a new organization",
    path: ["organizationName"],
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validar os dados de entrada
      const userData = extendedUserSchema.parse(req.body);
      
      // Verificar se o nome de usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Criar o usuário com senha criptografada
      const { 
        confirmPassword, 
        createOrganization, 
        organizationName, 
        organizationIdentifier,
        organizationDomain,
        ...userToCreate 
      } = userData;
      
      // Determinar o papel do usuário com base no registro
      let role = "user"; // Papel padrão
      let organizationId: number | undefined;
      
      // Se estiver criando uma organização como parte do registro
      if (createOrganization && organizationName && organizationIdentifier) {
        // Verificar se já existe uma organização com o mesmo identificador
        const existingOrg = await storage.getOrganizationByIdentifier(organizationIdentifier);
        if (existingOrg) {
          return res.status(400).json({ message: "Organization with this identifier already exists" });
        }
        
        // Criar a organização
        const organization = await storage.createOrganization({
          name: organizationName,
          identifier: organizationIdentifier,
          domain: organizationDomain || "",
          status: "active",
          plan: "trial"
        });
        
        organizationId = organization.id;
        role = "org_admin"; // Usuário que cria organização é administrador
        
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
      
      // Criar o usuário
      const user = await storage.createUser({
        ...userToCreate,
        password: await hashPassword(userToCreate.password),
        role,
        organizationId,
        status: "active",
        loginAttempts: 0
      });
      
      // Se criou organização, adicionar usuário como membro da organização
      if (organizationId) {
        await storage.createOrganizationMember({
          userId: user.id,
          organizationId,
          role: "owner"
        });
      }

      // Autenticar o usuário
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Registrar atividade
        storage.createActivityLog({
          userId: user.id,
          organizationId,
          action: "register",
          entity: "user",
          entityId: user.id,
          details: createOrganization ? "User and organization registration" : "User registration",
          ipAddress: req.ip || "127.0.0.1"
        });
        
        // Registrar evento de segurança
        storage.createSecurityLog({
          userId: user.id,
          organizationId,
          eventType: "user_created",
          status: "success",
          ipAddress: req.ip || "127.0.0.1",
          details: { 
            method: "registration", 
            createdOrganization: createOrganization
          }
        });
        
        // Retornar usuário sem a senha
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          createdOrganization: !!createOrganization,
          organizationId
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Obter dados da organização do usuário, se existir
          let organizationData;
          if (user.organizationId) {
            organizationData = await storage.getOrganization(user.organizationId);
          }
          
          // Carregar empresas do usuário
          const companies = await storage.getCompaniesByUser(user.id);
          
          // Registrar log de atividade
          await storage.createActivityLog({
            userId: user.id,
            organizationId: user.organizationId,
            action: "login",
            entity: "user",
            entityId: user.id,
            details: "User login successful",
            ipAddress: req.ip || "127.0.0.1",
            userAgent: req.headers['user-agent'] || "Unknown"
          });
          
          // Verificar se o usuário precisará de 2FA
          let requiresTwoFactor = false;
          if (user.twoFactorEnabled) {
            requiresTwoFactor = true;
          } else if (user.organizationId) {
            // Verificar configurações da organização para saber se 2FA é obrigatório
            const settings = await storage.getOrganizationSettings(user.organizationId);
            if (settings && 
                ((settings.twoFactorPolicy.required) || 
                 (settings.twoFactorPolicy.requiredForAdmins && 
                  (user.role === 'org_admin' || user.role === 'admin')))) {
              requiresTwoFactor = true;
            }
          }
          
          // Se 2FA é necessário, marcar sessão como não autenticada com 2FA
          if (requiresTwoFactor) {
            req.session.twoFactorAuthenticated = false;
          } else {
            req.session.twoFactorAuthenticated = true;
          }
          
          // Se o usuário tiver uma empresa padrão, guardar na sessão
          if (user.defaultCompanyId) {
            req.session.currentCompanyId = user.defaultCompanyId;
          } else if (companies.length > 0) {
            req.session.currentCompanyId = companies[0].id;
          }
          
          // Guardar organização atual na sessão
          if (user.organizationId) {
            req.session.currentOrganizationId = user.organizationId;
          }
          
          // Retornar usuário sem a senha
          const { password, ...userWithoutPassword } = user;
          res.status(200).json({
            user: userWithoutPassword,
            organization: organizationData,
            companies,
            requiresTwoFactor
          });
        } catch (error) {
          console.error("Error processing login:", error);
          next(error);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Criar log de atividade antes do logout
    if (req.user) {
      // Capturar informações antes de limpar a sessão
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      
      storage.createActivityLog({
        userId,
        organizationId,
        action: "logout",
        entity: "user",
        entityId: userId,
        details: "User logout",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers['user-agent'] || "Unknown"
      });
      
      storage.createSecurityLog({
        userId,
        organizationId,
        eventType: "session_terminated",
        status: "success",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers['user-agent'] || "Unknown",
        details: { reason: "user_logout" }
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      
      // Limpar informações da sessão
      req.session.twoFactorAuthenticated = false;
      req.session.currentOrganizationId = undefined;
      req.session.currentCompanyId = undefined;
      
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Obter dados do usuário atual
      const user = req.user!;
      
      // Obter empresas associadas ao usuário
      const companies = await storage.getCompaniesByUser(user.id);
      
      // Obter dados da organização, se existir
      let organization = null;
      if (user.organizationId) {
        organization = await storage.getOrganization(user.organizationId);
      }
      
      // Obter empresa atual da sessão, se existir
      let currentCompany = null;
      if (req.session.currentCompanyId) {
        const currentCompanyId = req.session.currentCompanyId;
        const company = companies.find(c => c.id === currentCompanyId);
        if (company) {
          currentCompany = company;
        } else if (companies.length > 0) {
          // Se a empresa atual não for encontrada, usar a primeira
          currentCompany = companies[0];
          req.session.currentCompanyId = companies[0].id;
        }
      } else if (companies.length > 0) {
        // Se não houver empresa atual na sessão, usar a primeira
        currentCompany = companies[0];
        req.session.currentCompanyId = companies[0].id;
      }
      
      // Retornar usuário sem a senha
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({
        user: userWithoutPassword,
        organization,
        companies,
        currentCompany,
        twoFactorAuthenticated: !!req.session.twoFactorAuthenticated
      });
    } catch (error) {
      console.error("Error getting user data:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
}
