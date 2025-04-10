import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

async function createSchema() {
  console.log("Criando esquema do banco de dados...");
  
  try {
    // Criar enums
    await db.execute(sql`
      CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'manager', 'user');
      CREATE TYPE IF NOT EXISTS certificate_type AS ENUM ('A1', 'A3');
      CREATE TYPE IF NOT EXISTS activity_action AS ENUM ('login', 'logout', 'view', 'create', 'update', 'delete', 'view_password');
      CREATE TYPE IF NOT EXISTS activity_entity AS ENUM ('user', 'company', 'certificate', 'system');
    `);
    
    // Criar tabelas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        identifier TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        entity TEXT NOT NULL,
        identifier TEXT NOT NULL,
        type certificate_type NOT NULL,
        issued_date TIMESTAMP NOT NULL,
        expiration_date TIMESTAMP NOT NULL,
        password TEXT NOT NULL,
        file_path TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS certificate_systems (
        id SERIAL PRIMARY KEY,
        certificate_id INTEGER NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT,
        description TEXT
      );
      
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        view BOOLEAN NOT NULL DEFAULT TRUE,
        edit BOOLEAN NOT NULL DEFAULT FALSE,
        delete BOOLEAN NOT NULL DEFAULT FALSE,
        view_password BOOLEAN NOT NULL DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action activity_action NOT NULL,
        entity activity_entity NOT NULL,
        entity_id INTEGER,
        details JSONB,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        ip_address TEXT
      );
    `);
    
    console.log("Esquema criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar esquema:", error);
  }
}

createSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });