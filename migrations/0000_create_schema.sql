CREATE TYPE "user_role" AS ENUM ('admin', 'manager', 'user');
CREATE TYPE "certificate_type" AS ENUM ('A1', 'A3');
CREATE TYPE "activity_action" AS ENUM ('login', 'logout', 'view', 'create', 'update', 'delete', 'view_password');
CREATE TYPE "activity_entity" AS ENUM ('user', 'company', 'certificate', 'system');

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "users_username_unique" UNIQUE("username"),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "companies" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "identifier" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "companies_identifier_unique" UNIQUE("identifier")
);

CREATE TABLE IF NOT EXISTS "certificates" (
  "id" SERIAL PRIMARY KEY,
  "company_id" integer NOT NULL,
  "name" text NOT NULL,
  "entity" text NOT NULL,
  "identifier" text NOT NULL,
  "type" "certificate_type" NOT NULL,
  "issued_date" timestamp NOT NULL,
  "expiration_date" timestamp NOT NULL,
  "password" text NOT NULL,
  "file_path" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "certificate_systems" (
  "id" SERIAL PRIMARY KEY,
  "certificate_id" integer NOT NULL,
  "name" text NOT NULL,
  "url" text,
  "description" text,
  CONSTRAINT "certificate_systems_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "user_permissions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer NOT NULL,
  "company_id" integer NOT NULL,
  "view" boolean NOT NULL DEFAULT true,
  "edit" boolean NOT NULL DEFAULT false,
  "delete" boolean NOT NULL DEFAULT false,
  "view_password" boolean NOT NULL DEFAULT false,
  CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_permissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer,
  "action" "activity_action" NOT NULL,
  "entity" "activity_entity" NOT NULL,
  "entity_id" integer,
  "details" jsonb,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);