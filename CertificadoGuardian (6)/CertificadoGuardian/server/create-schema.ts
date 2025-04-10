import { db, pool } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

async function createSchema() {
  console.log('Creating database schema...');

  try {
    // Create all tables based on schema
    await db.execute(sql`
      -- Users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(50) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "role" VARCHAR(20) NOT NULL DEFAULT 'user',
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        "organization_id" INTEGER,
        "default_company_id" INTEGER,
        "two_factor_enabled" BOOLEAN DEFAULT FALSE,
        "two_factor_secret" VARCHAR(255),
        "login_attempts" INTEGER DEFAULT 0,
        "last_login_at" TIMESTAMP,
        "last_login_ip" VARCHAR(45),
        "password_updated_at" TIMESTAMP,
        "password_reset_token" VARCHAR(255),
        "password_reset_expires" TIMESTAMP,
        "must_change_password" BOOLEAN DEFAULT FALSE
      );

      -- Organizations (tenants) table
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "identifier" VARCHAR(50) NOT NULL UNIQUE,
        "domain" VARCHAR(100),
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "plan" VARCHAR(20) NOT NULL DEFAULT 'basic',
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        "logo_url" VARCHAR(255),
        "contact_email" VARCHAR(100),
        "contact_phone" VARCHAR(20),
        "subscription_id" VARCHAR(50),
        "subscription_status" VARCHAR(20)
      );

      -- Organization settings table
      CREATE TABLE IF NOT EXISTS "organization_settings" (
        "id" SERIAL PRIMARY KEY,
        "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "password_policy" JSONB,
        "two_factor_policy" JSONB,
        "session_policy" JSONB,
        "ip_restrictions" JSONB DEFAULT '[]',
        "api_settings" JSONB DEFAULT '{"enabled": false, "rateLimits": {"perMinute": 60, "perHour": 1000}}',
        "backup_settings" JSONB DEFAULT '{"autoBackupEnabled": true, "frequency": "daily", "encryptBackups": true}',
        "notification_settings" JSONB,
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        UNIQUE("organization_id")
      );

      -- Organization members table
      CREATE TABLE IF NOT EXISTS "organization_members" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "role" VARCHAR(20) NOT NULL DEFAULT 'member',
        "invited_by" INTEGER,
        "invite_accepted" BOOLEAN DEFAULT TRUE,
        "invite_token" VARCHAR(255),
        "invite_expires" TIMESTAMP,
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        UNIQUE("user_id", "organization_id")
      );

      -- Companies table
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "identifier" VARCHAR(50) NOT NULL,
        "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        "address" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(50),
        "country" VARCHAR(50),
        "postal_code" VARCHAR(20),
        "contact_name" VARCHAR(100),
        "contact_email" VARCHAR(100),
        "contact_phone" VARCHAR(20),
        UNIQUE("identifier", "organization_id")
      );

      -- User permissions table
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "view_permission" BOOLEAN DEFAULT FALSE,
        "edit_permission" BOOLEAN DEFAULT FALSE,
        "delete_permission" BOOLEAN DEFAULT FALSE,
        "view_password_permission" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,
        UNIQUE("user_id", "company_id")
      );

      -- Certificates table
      CREATE TABLE IF NOT EXISTS "certificates" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "entity" VARCHAR(100) NOT NULL,
        "identifier" VARCHAR(20) NOT NULL,
        "type" VARCHAR(10) NOT NULL,
        "issued_date" TIMESTAMP NOT NULL,
        "expiration_date" TIMESTAMP NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "certificate_file" VARCHAR(255),
        "systems" JSONB NOT NULL DEFAULT '[]',
        "notes" TEXT,
        "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "updated_by" INTEGER NOT NULL REFERENCES "users"("id")
      );

      -- Certificate systems table
      CREATE TABLE IF NOT EXISTS "certificate_systems" (
        "id" SERIAL PRIMARY KEY,
        "certificate_id" INTEGER NOT NULL REFERENCES "certificates"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "url" VARCHAR(255),
        "purpose" VARCHAR(255),
        "environment" VARCHAR(20),
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP
      );

      -- Activity logs table
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "organization_id" INTEGER REFERENCES "organizations"("id") ON DELETE SET NULL,
        "company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
        "action" VARCHAR(50) NOT NULL,
        "entity" VARCHAR(50) NOT NULL,
        "entity_id" INTEGER,
        "details" TEXT,
        "timestamp" TIMESTAMP DEFAULT NOW(),
        "ip_address" VARCHAR(45),
        "user_agent" TEXT
      );

      -- Security logs table
      CREATE TABLE IF NOT EXISTS "security_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "organization_id" INTEGER REFERENCES "organizations"("id") ON DELETE SET NULL,
        "event_type" VARCHAR(50) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "details" JSONB,
        "timestamp" TIMESTAMP DEFAULT NOW(),
        "ip_address" VARCHAR(45),
        "user_agent" TEXT
      );

      -- Session table for connect-pg-simple
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR NOT NULL PRIMARY KEY,
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    await pool.end();
  }
}

createSchema();