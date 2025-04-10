import { db } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  organizations,
  companies,
  users,
  certificates,
  certificateSystems,
  userPermissions,
  organizationMembers,
  activityLogs,
  securityLogs,
  organizationSettings
} from "@shared/schema";
import { storage } from "./storage";

// Criar função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Para hash de senha
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function populateTestData() {
  try {
    console.log("Iniciando população de dados de teste...");
    
    // Verificar se já existe uma organização
    const existingOrgs = await db.select().from(organizations).limit(1);
    
    if (existingOrgs.length > 0) {
      console.log("Organização já existe. Usando organização existente.");
      
      // Obter organização existente
      const orgId = existingOrgs[0].id;
      
      // Criar novas empresas
      const empresas = [
        {
          name: "TechSolutions Ltda",
          identifier: "12.345.678/0001-01",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Indústria Rio Verde S.A.",
          identifier: "98.765.432/0001-02",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Comércio Azul Express",
          identifier: "45.678.901/0001-03",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Inserir empresas
      for (const empresa of empresas) {
        // Verificar se já existe
        const existingCompany = await db.select()
          .from(companies)
          .where(companies => companies.identifier === empresa.identifier);
        
        if (existingCompany.length === 0) {
          console.log(`Criando empresa: ${empresa.name}`);
          await db.insert(companies).values(empresa);
        } else {
          console.log(`Empresa ${empresa.name} já existe.`);
        }
      }
      
      // Obter todas as empresas criadas
      const allCompanies = await db.select().from(companies);
      
      // Criar usuários de teste
      const testUsers = [
        {
          username: "financeiro",
          password: await hashPassword("senha123"),
          email: "financeiro@teste.com",
          name: "Departamento Financeiro",
          role: "user",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: "tecnico",
          password: await hashPassword("senha123"),
          email: "tecnico@teste.com",
          name: "Suporte Técnico",
          role: "user",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: "gerente",
          password: await hashPassword("senha123"),
          email: "gerente@teste.com",
          name: "Gerência",
          role: "manager",
          organizationId: orgId,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Inserir usuários
      const createdUserIds = [];
      for (const user of testUsers) {
        // Verificar se já existe
        const existingUser = await db.select()
          .from(users)
          .where(users => users.username === user.username);
        
        if (existingUser.length === 0) {
          console.log(`Criando usuário: ${user.username}`);
          const [insertedUser] = await db.insert(users).values(user).returning();
          createdUserIds.push(insertedUser.id);
          
          // Adicionar como membro da organização
          await db.insert(organizationMembers).values({
            userId: insertedUser.id,
            organizationId: orgId,
            role: user.role === "manager" ? "admin" : "member",
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          console.log(`Usuário ${user.username} já existe.`);
          createdUserIds.push(existingUser[0].id);
        }
      }
      
      // Criar permissões para os usuários em diferentes empresas
      for (let i = 0; i < createdUserIds.length; i++) {
        const userId = createdUserIds[i];
        
        // Dar permissões em diferentes empresas conforme o perfil
        let empresasPermitidas = [];
        if (i === 0) { // financeiro - apenas primeira empresa
          empresasPermitidas = [allCompanies[0]];
        } else if (i === 1) { // tecnico - todas as empresas, mas sem permissão de exclusão
          empresasPermitidas = allCompanies;
        } else { // gerente - todas as empresas com todas as permissões
          empresasPermitidas = allCompanies;
        }
        
        for (const empresa of empresasPermitidas) {
          // Verificar se já existe
          const existingPerm = await db.select()
            .from(userPermissions)
            .where(userPermissions => userPermissions.userId === userId && userPermissions.companyId === empresa.id);
            
          if (existingPerm.length === 0) {
            console.log(`Configurando permissões para usuário ${userId} na empresa ${empresa.name}`);
            await db.insert(userPermissions).values({
              userId,
              companyId: empresa.id,
              viewPermission: true,
              editPermission: true,
              deletePermission: i === 2, // apenas gerente pode excluir
              viewPasswordPermission: i === 2, // apenas gerente pode ver senhas
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            console.log(`Permissões já existem para usuário ${userId} na empresa ${empresa.id}`);
          }
        }
      }
      
      // Criar certificados para cada empresa
      for (const empresa of allCompanies) {
        // Certificado tipo A1
        const certA1 = {
          name: `Certificado A1 - ${empresa.name}`,
          entity: "Empresa",
          identifier: empresa.identifier,
          companyId: empresa.id,
          type: "A1",
          issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
          expirationDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 dias à frente
          password: "senha_protegida_cert",
          systems: JSON.stringify([]), // Array vazio
          createdBy: 1, // admin
          updatedBy: 1, // admin
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Certificado tipo A3
        const certA3 = {
          name: `Certificado A3 - ${empresa.name}`,
          entity: "Empresa",
          identifier: empresa.identifier,
          companyId: empresa.id,
          type: "A3",
          issuedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 dias atrás
          expirationDate: new Date(Date.now() + 670 * 24 * 60 * 60 * 1000), // 670 dias à frente
          password: "1234",
          systems: JSON.stringify([]),
          createdBy: 1, // admin
          updatedBy: 1, // admin
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Certificado expirado para testes
        const certExpirado = {
          name: `Certificado Expirado - ${empresa.name}`,
          entity: "Empresa",
          identifier: empresa.identifier,
          companyId: empresa.id,
          type: "A1",
          issuedDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 dias atrás
          expirationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás (expirado)
          password: "senha_cert_expirado",
          systems: JSON.stringify([]),
          createdBy: 1, // admin
          updatedBy: 1, // admin
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Inserir certificados
        const certIds = [];
        for (const cert of [certA1, certA3, certExpirado]) {
          // Verificar se já existe
          const existingCert = await db.select()
            .from(certificates)
            .where(certificates => certificates.serialNumber === cert.serialNumber);
          
          if (existingCert.length === 0) {
            console.log(`Criando certificado: ${cert.name}`);
            const [insertedCert] = await db.insert(certificates).values(cert).returning();
            certIds.push(insertedCert.id);
          } else {
            console.log(`Certificado ${cert.name} já existe.`);
            certIds.push(existingCert[0].id);
          }
        }
        
        // Criar sistemas que usam os certificados
        const sistemas = [
          {
            name: "Sistema NFe SEFAZ",
            url: "https://nfe.fazenda.gov.br/",
            purpose: "Emissão de notas fiscais eletrônicas",
            certificateId: certIds[0] // A1
          },
          {
            name: "Portal e-CAC",
            url: "https://cav.receita.fazenda.gov.br/",
            purpose: "Acesso ao portal da Receita Federal",
            certificateId: certIds[1] // A3
          },
          {
            name: "Login Gov.br",
            url: "https://www.gov.br/",
            purpose: "Autenticação em serviços federais",
            certificateId: certIds[1] // A3
          }
        ];
        
        // Inserir sistemas
        for (const sistema of sistemas) {
          // Verificar se já existe
          const existingSys = await db.select()
            .from(certificateSystems)
            .where(systems => systems.name === sistema.name && systems.certificateId === sistema.certificateId);
          
          if (existingSys.length === 0) {
            console.log(`Criando sistema: ${sistema.name} para certificado ${sistema.certificateId}`);
            await db.insert(certificateSystems).values({
              ...sistema,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            console.log(`Sistema ${sistema.name} já existe para o certificado.`);
          }
        }
        
        // Criar logs de atividades para os certificados
        for (const certId of certIds) {
          await db.insert(activityLogs).values({
            userId: 1, // admin
            organizationId: orgId,
            companyId: empresa.id,
            action: "create",
            entity: "certificate",
            entityId: certId,
            details: { message: "Certificado criado durante população de dados" },
            timestamp: new Date(),
          });
          
          // Registrar alguns acessos
          await db.insert(activityLogs).values({
            userId: createdUserIds[2], // gerente
            organizationId: orgId,
            companyId: empresa.id,
            action: "view",
            entity: "certificate",
            entityId: certId,
            details: { message: "Certificado visualizado pelo gerente" },
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
          });
        }
      }
      
      // Criar logs de segurança
      const securityEvents = [
        {
          userId: 1, // admin
          organizationId: orgId,
          eventType: "login",
          status: "success",
          ipAddress: "192.168.1.100",
          details: { 
            browser: "Chrome 98.0.4758.102", 
            platform: "Windows 10"
          },
          timestamp: new Date(),
        },
        {
          userId: createdUserIds[0], // financeiro
          organizationId: orgId,
          eventType: "login",
          status: "success",
          ipAddress: "192.168.1.101",
          details: { 
            browser: "Firefox 97.0", 
            platform: "macOS 12.2.1"
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        },
        {
          userId: null,
          organizationId: orgId,
          eventType: "login",
          status: "failed",
          ipAddress: "192.168.1.150",
          details: { 
            browser: "Chrome 99.0.4844.51", 
            platform: "Ubuntu 20.04",
            reason: "Invalid credentials",
            username: "hacker"
          },
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
        }
      ];
      
      // Inserir logs de segurança
      for (const event of securityEvents) {
        console.log(`Criando log de segurança: ${event.eventType} - ${event.status}`);
        await db.insert(securityLogs).values(event);
      }
      
      console.log("População de dados de teste concluída com sucesso!");
    } else {
      console.log("Nenhuma organização encontrada. Execute create-schema.ts primeiro.");
    }
  } catch (error) {
    console.error("Erro ao popular dados de teste:", error);
  }
}

populateTestData().then(() => {
  console.log("Script finalizado.");
  process.exit(0);
}).catch(error => {
  console.error("Erro no script:", error);
  process.exit(1);
});