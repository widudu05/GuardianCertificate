import { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { 
  organizations, 
  users, 
  companies, 
  certificates,
  securityLogs
} from "@shared/schema";
import { count, eq, sql } from "drizzle-orm";

/**
 * Verifica se o usuário tem permissão de administrador
 */
export function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Permissão negada" });
  }

  next();
}

/**
 * Obtém todas as organizações com estatísticas
 */
export async function getOrganizations(req: Request, res: Response) {
  try {
    // Buscar todas as organizações
    const orgs = await db.select().from(organizations);
    
    // Para cada organização, buscar contagens
    const result = await Promise.all(
      orgs.map(async (org) => {
        // Contar usuários
        const [usersCount] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.organizationId, org.id));
          
        // Contar empresas
        const [companiesCount] = await db
          .select({ count: count() })
          .from(companies)
          .where(eq(companies.organizationId, org.id));
          
        // Contar certificados (através das empresas)
        const orgCompanies = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.organizationId, org.id));
        
        let certsCount = 0;
        if (orgCompanies.length > 0) {
          const companyIds = orgCompanies.map(c => c.id);
          
          // Usando uma subconsulta para contar certificados por empresa
          const [certResult] = await db
            .select({ 
              count: count()
            })
            .from(certificates)
            .where(
              sql`${certificates.companyId} IN (${companyIds.join(',')})`
            );
            
          certsCount = certResult?.count || 0;
        }
        
        return {
          ...org,
          usersCount: usersCount?.count || 0,
          companiesCount: companiesCount?.count || 0,
          certificatesCount: certsCount
        };
      })
    );
    
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar organizações:", error);
    res.status(500).json({ message: "Erro ao buscar organizações" });
  }
}

/**
 * Obtém estatísticas de usuários
 */
export async function getUsersStats(req: Request, res: Response) {
  try {
    // Contagem total de usuários
    const [totalUsers] = await db
      .select({ count: count() })
      .from(users);
      
    // Contagem de usuários ativos
    const [activeUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "active"));
      
    // Contagem de usuários por perfil
    const usersRoles = await db
      .select({
        role: users.role,
        count: count()
      })
      .from(users)
      .groupBy(users.role);
      
    // Contagem de usuários por organização
    const usersByOrg = await db
      .select({
        orgId: users.organizationId,
        count: count()
      })
      .from(users)
      .groupBy(users.organizationId);
      
    // Juntar as informações da organização
    const usersByOrganization = await Promise.all(
      usersByOrg.map(async (item) => {
        if (!item.orgId) return { name: "Sem organização", value: item.count };
        
        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, item.orgId));
          
        return {
          name: org?.name || `Organização ${item.orgId}`,
          value: item.count
        };
      })
    );
    
    // Logins recentes
    const recentLogins = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        lastLogin: users.lastLoginAt,
        orgId: users.organizationId
      })
      .from(users)
      .where(sql`${users.lastLoginAt} IS NOT NULL`)
      .orderBy(sql`${users.lastLoginAt} DESC`)
      .limit(5);
      
    // Juntar informações da organização aos logins
    const logins = await Promise.all(
      recentLogins.map(async (login) => {
        if (!login.orgId) return { ...login, organization: "Sem organização" };
        
        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, login.orgId));
          
        return {
          ...login,
          organization: org?.name || `Organização ${login.orgId}`
        };
      })
    );
    
    // Formatar dados para resposta
    const usersByRole = usersRoles.map(role => ({
      name: role.role || "Sem perfil",
      value: role.count
    }));
    
    res.json({
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0,
      inactiveUsers: (totalUsers?.count || 0) - (activeUsers?.count || 0),
      usersByRole,
      usersByOrganization,
      recentLogins: logins
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de usuários:", error);
    res.status(500).json({ message: "Erro ao buscar estatísticas de usuários" });
  }
}

/**
 * Obtém estatísticas de certificados
 */
export async function getCertificatesStats(req: Request, res: Response) {
  try {
    // Contagem total de certificados
    const [totalCerts] = await db
      .select({ count: count() })
      .from(certificates);
      
    // Certificados por tipo
    const certsByType = await db
      .select({
        type: certificates.type,
        count: count()
      })
      .from(certificates)
      .groupBy(certificates.type);
      
    // Certificados por mês (últimos 12 meses)
    const now = new Date();
    const monthsData = [];
    
    // Gerar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - i);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Nome do mês abreviado
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(monthDate);
      
      // Consultar certificados A1 no mês
      const [a1Count] = await db
        .select({ count: count() })
        .from(certificates)
        .where(
          sql`${certificates.type} = 'A1' AND 
              EXTRACT(YEAR FROM ${certificates.createdAt}) = ${year} AND 
              EXTRACT(MONTH FROM ${certificates.createdAt}) = ${month + 1}`
        );
        
      // Consultar certificados A3 no mês
      const [a3Count] = await db
        .select({ count: count() })
        .from(certificates)
        .where(
          sql`${certificates.type} = 'A3' AND 
              EXTRACT(YEAR FROM ${certificates.createdAt}) = ${year} AND 
              EXTRACT(MONTH FROM ${certificates.createdAt}) = ${month + 1}`
        );
        
      monthsData.unshift({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1, 3),
        a1: a1Count?.count || 0,
        a3: a3Count?.count || 0
      });
    }
    
    // Estimar certificados válidos, expirados e prestes a expirar
    const today = new Date();
    
    // Expirados (data < hoje)
    const [expiredCount] = await db
      .select({ count: count() })
      .from(certificates)
      .where(sql`${certificates.expirationDate} < ${today}`);
      
    // Prestes a expirar (data entre hoje e hoje + 30 dias)
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const [expiringCount] = await db
      .select({ count: count() })
      .from(certificates)
      .where(
        sql`${certificates.expirationDate} >= ${today} AND 
            ${certificates.expirationDate} <= ${thirtyDaysFromNow}`
      );
      
    // Válidos (não expirados)
    const [validCount] = await db
      .select({ count: count() })
      .from(certificates)
      .where(sql`${certificates.expirationDate} >= ${today}`);
    
    res.json({
      total: totalCerts?.count || 0,
      valid: validCount?.count || 0,
      expired: expiredCount?.count || 0,
      expiring: expiringCount?.count || 0,
      byType: certsByType.map(type => ({
        name: type.type || "N/A",
        value: type.count
      })),
      byMonth: monthsData
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de certificados:", error);
    res.status(500).json({ message: "Erro ao buscar estatísticas de certificados" });
  }
}

/**
 * Registrar as rotas administrativas na aplicação
 */
export function registerAdminRoutes(app: any) {
  // Rotas de organizações
  app.get("/api/admin/organizations", isAdmin, getOrganizations);
  
  // Rotas de usuários
  app.get("/api/admin/users/stats", isAdmin, getUsersStats);
  
  // Rotas de certificados
  app.get("/api/admin/certificates/stats", isAdmin, getCertificatesStats);
}