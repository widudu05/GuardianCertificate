import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, userRoleEnum } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function setupDatabase() {
  console.log("Configurando banco de dados...");

  try {
    // Verificar se as tabelas já existem
    console.log("Verificando se a tabela de usuários existe...");
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_name='users'
    `);
    
    const tableExists = tablesResult.rows.length > 0;
    
    if (!tableExists) {
      console.log("Criando tabelas...");
      // Criar tabelas usando objetos de schema do Drizzle
      await db.execute(sql`
        CREATE TYPE IF NOT EXISTS "user_role" AS ENUM ('admin', 'manager', 'user');
        CREATE TYPE IF NOT EXISTS "certificate_type" AS ENUM ('A1', 'A3');
        CREATE TYPE IF NOT EXISTS "activity_action" AS ENUM ('login', 'logout', 'view', 'create', 'update', 'delete', 'view_password');
        CREATE TYPE IF NOT EXISTS "activity_entity" AS ENUM ('user', 'company', 'certificate', 'system');
        
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT NOT NULL,
          "role" user_role NOT NULL DEFAULT 'user',
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "companies" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "identifier" TEXT NOT NULL UNIQUE,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "certificates" (
          "id" SERIAL PRIMARY KEY,
          "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
          "name" TEXT NOT NULL,
          "entity" TEXT NOT NULL,
          "identifier" TEXT NOT NULL,
          "type" certificate_type NOT NULL,
          "issued_date" TIMESTAMP NOT NULL,
          "expiration_date" TIMESTAMP NOT NULL,
          "password" TEXT NOT NULL,
          "file_path" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "certificate_systems" (
          "id" SERIAL PRIMARY KEY,
          "certificate_id" INTEGER NOT NULL REFERENCES "certificates"("id") ON DELETE CASCADE,
          "name" TEXT NOT NULL,
          "url" TEXT,
          "description" TEXT
        );
        
        CREATE TABLE IF NOT EXISTS "user_permissions" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
          "view" BOOLEAN NOT NULL DEFAULT TRUE,
          "edit" BOOLEAN NOT NULL DEFAULT FALSE,
          "delete" BOOLEAN NOT NULL DEFAULT FALSE,
          "view_password" BOOLEAN NOT NULL DEFAULT FALSE
        );
        
        CREATE TABLE IF NOT EXISTS "activity_logs" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
          "action" activity_action NOT NULL,
          "entity" activity_entity NOT NULL,
          "entity_id" INTEGER,
          "details" JSONB,
          "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
          "ip_address" TEXT
        );
      `);
      console.log("Tabelas criadas com sucesso!");
    }

    // Verificar se já existe um admin
    console.log("Verificando se o usuário administrador já existe...");
    const adminResult = await db.execute(sql`
      SELECT * FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    const adminExists = adminResult.rows.length > 0;
    
    if (!adminExists) {
      console.log("Criando usuário administrador...");
      // Criar usuário admin
      const adminPassword = await hashPassword("Admin@123");
      
      await db.insert(users).values({
        username: "admin",
        password: adminPassword,
        name: "Administrador do Sistema",
        email: "admin@certificadoguardian.com.br",
        role: "admin"
      });
      
      console.log("Usuário administrador criado com sucesso!");
      console.log("Credenciais de acesso:");
      console.log("Usuário: admin");
      console.log("Senha: Admin@123");
    } else {
      console.log("Usuário administrador já existe.");
    }
    
    console.log("Configuração do banco de dados concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a configuração do banco de dados:", error);
  }
}

setupDatabase()
  .then(() => {
    console.log("Script concluído.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });