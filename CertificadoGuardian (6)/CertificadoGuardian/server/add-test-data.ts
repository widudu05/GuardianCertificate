import { db } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  organizations,
  companies,
  users,
  organizationMembers,
  userPermissions
} from "@shared/schema";

// Criar função assíncrona para hash de senha
const scryptAsync = promisify(scrypt);

// Para hash de senha
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addTestData() {
  try {
    console.log("Adicionando dados de teste básicos...");
    
    // Verificar se já existe uma organização
    const [existingOrg] = await db.select().from(organizations).limit(1);
    
    if (existingOrg) {
      console.log("Organização encontrada: " + existingOrg.name);
      
      // Adicionar empresas
      const empresasParaAdicionar = [
        {
          name: "TechSolutions Ltda",
          identifier: "12.345.678/0001-01", 
          organizationId: existingOrg.id,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Indústria Rio Verde S.A.",
          identifier: "98.765.432/0001-02",
          organizationId: existingOrg.id,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Comércio Azul Express",
          identifier: "45.678.901/0001-03",
          organizationId: existingOrg.id,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Adicionar cada empresa verificando se já existe
      for (const empresa of empresasParaAdicionar) {
        const [existingCompany] = await db.select()
          .from(companies)
          .where(c => c.identifier === empresa.identifier);
        
        if (!existingCompany) {
          console.log(`Adicionando empresa: ${empresa.name}`);
          await db.insert(companies).values(empresa);
        } else {
          console.log(`Empresa já existe: ${empresa.name}`);
        }
      }
      
      // Buscar todas as empresas para associar aos usuários
      const allCompanies = await db.select().from(companies);
      console.log(`Total de empresas: ${allCompanies.length}`);
      
      // Adicionar usuários de teste
      const usuariosParaAdicionar = [
        {
          username: "financeiro",
          password: await hashPassword("senha123"),
          email: "financeiro@teste.com",
          name: "Departamento Financeiro",
          role: "user",
          organizationId: existingOrg.id,
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
          organizationId: existingOrg.id,
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
          organizationId: existingOrg.id,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Adicionar cada usuário verificando se já existe
      for (const usuario of usuariosParaAdicionar) {
        const [existingUser] = await db.select()
          .from(users)
          .where(u => u.username === usuario.username);
        
        let userId: number;
        
        if (!existingUser) {
          console.log(`Adicionando usuário: ${usuario.username}`);
          const [newUser] = await db.insert(users).values(usuario).returning();
          userId = newUser.id;
          
          // Adicionar à organização
          await db.insert(organizationMembers).values({
            userId: userId,
            organizationId: existingOrg.id,
            role: usuario.role === "manager" ? "admin" : "member",
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          console.log(`Usuário já existe: ${usuario.username}`);
          userId = existingUser.id;
        }
        
        // Atribuir permissões para todas as empresas
        for (const company of allCompanies) {
          const [existingPerm] = await db.select()
            .from(userPermissions)
            .where(p => p.userId === userId && p.companyId === company.id);
          
          if (!existingPerm) {
            console.log(`Adicionando permissões para usuário ${usuario.username} na empresa ${company.name}`);
            
            // Permissões conforme o tipo de usuário
            let deletePermission = false;
            let viewPasswordPermission = false;
            
            if (usuario.role === "manager") {
              deletePermission = true;
              viewPasswordPermission = true;
            }
            
            await db.insert(userPermissions).values({
              userId,
              companyId: company.id,
              viewPermission: true,
              editPermission: true,
              deletePermission,
              viewPasswordPermission,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            console.log(`Permissões já existem para usuário ${usuario.username} na empresa ${company.name}`);
          }
        }
      }
      
      console.log("Dados básicos de teste adicionados com sucesso!");
    } else {
      console.log("Nenhuma organização encontrada. Execute create-schema.ts primeiro.");
    }
  } catch (error) {
    console.error("Erro ao adicionar dados básicos de teste:", error);
  }
}

addTestData().then(() => {
  console.log("Script finalizado.");
  process.exit(0);
}).catch(error => {
  console.error("Erro no script:", error);
  process.exit(1);
});