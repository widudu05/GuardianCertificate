import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { 
  User as SelectUser, 
  InsertUser, 
  InsertActivityLog, 
  UserPermission
} from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
    
    interface Request {
      companyId?: number;
    }
  }
}

// Encryption settings for certificate passwords
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

const scryptAsync = promisify(scrypt);

// Password hashing functions
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Certificate password encryption/decryption
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}.${encrypted}`;
}

export function decrypt(text: string): string {
  const [ivHex, encryptedText] = text.split('.');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Auth middlewares
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}

export async function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admin has access to all companies
  if (req.user.role === 'admin') {
    return next();
  }
  
  const companyId = parseInt(req.params.companyId || req.body.companyId || req.query.companyId);
  
  if (!companyId) {
    return res.status(400).json({ message: "Company ID required" });
  }
  
  const permission = await storage.getUserPermissionsForCompany(req.user.id, companyId);
  
  if (!permission || !permission.view) {
    return res.status(403).json({ message: "You don't have access to this company" });
  }
  
  req.companyId = companyId;
  next();
}

export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "certificate-guardian-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        action: 'create',
        entity: 'user',
        entityId: user.id,
        details: { name: user.name },
        ipAddress: req.ip,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err, user) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Create activity log
        await storage.createActivityLog({
          userId: user.id,
          action: 'login',
          entity: 'user',
          entityId: user.id,
          details: { username: user.username },
          ipAddress: req.ip,
        });
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Create activity log before logout
      await storage.createActivityLog({
        userId,
        action: 'logout',
        entity: 'user',
        entityId: userId,
        details: { username: req.user.username },
        ipAddress: req.ip,
      });
      
      req.logout((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't return the password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  return {
    requireAuth,
    requireAdmin,
    requireCompanyAccess,
  };
}
