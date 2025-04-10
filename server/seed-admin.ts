import { db } from "./db";
import { users, activityLogs } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  console.log("Criando usuário administrador...");
  
  // Verificar se já existe um admin
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.role, "admin")
  });
  
  if (existingAdmin) {
    console.log("Usuário administrador já existe:", existingAdmin.username);
    return;
  }
  
  try {
    // Criar usuário administrador
    const adminPassword = await hashPassword("Admin@123");
    const [admin] = await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      name: "Administrador do Sistema",
      email: "admin@certificadoguardian.com.br",
      role: "admin"
    }).returning();
    
    console.log("Usuário administrador criado com sucesso:", admin.username);
    
    // Registrar atividade
    await db.insert(activityLogs).values({
      userId: admin.id,
      action: "create",
      entity: "user",
      entityId: admin.id,
      details: { name: admin.name },
      ipAddress: "localhost"
    });
    
    console.log("Credenciais de acesso:");
    console.log("Usuário: admin");
    console.log("Senha: Admin@123");
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });