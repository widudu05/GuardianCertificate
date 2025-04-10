import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, or, sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para o cliente Neon (PostgreSQL)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Criar pool de conexões
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo máximo em ms que uma conexão pode ficar inativa antes de ser encerrada
  connectionTimeoutMillis: 5000, // tempo máximo em ms para esperar por uma conexão
});

// Criar cliente Drizzle
export const db = drizzle(pool, { schema });

// Exportar operadores para uso em outros arquivos
export { eq, and, or, sql };