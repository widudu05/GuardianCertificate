import { db, pool } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedData() {
  console.log('Seeding database with initial data...');

  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    
    const [adminUser] = await db.insert(schema.users).values({
      username: 'admin',
      password: adminPassword,
      email: 'admin@guardiaocd.com',
      name: 'Administrador',
      role: 'system_admin',
      status: 'active',
    }).returning();
    
    console.log(`Created admin user with ID: ${adminUser.id}`);

    // Create a test organization
    const [organization] = await db.insert(schema.organizations).values({
      name: 'Organização Exemplo',
      identifier: 'org-exemplo',
      domain: 'guardiaocd.com',
      status: 'active',
      plan: 'enterprise',
      contactEmail: 'contato@guardiaocd.com',
    }).returning();
    
    console.log(`Created organization with ID: ${organization.id}`);

    // Add admin user to organization
    await db.insert(schema.organizationMembers).values({
      userId: adminUser.id,
      organizationId: organization.id,
      role: 'owner',
    });

    // Create organization settings
    await db.insert(schema.organizationSettings).values({
      organizationId: organization.id,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90,
        preventPasswordReuse: 5
      },
      twoFactorPolicy: {
        required: false,
        allowRememberDevice: true,
        rememberDeviceDays: 30
      },
      notificationSettings: {
        expiryNotifications: { days: [30, 15, 7, 1] },
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false
      }
    });

    // Create test companies
    const companies = [
      {
        name: 'Empresa A',
        identifier: 'empresa-a',
        organizationId: organization.id,
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01234-567',
        contactName: 'João Silva',
        contactEmail: 'joao@empresaa.com',
        contactPhone: '(11) 98765-4321'
      },
      {
        name: 'Empresa B',
        identifier: 'empresa-b',
        organizationId: organization.id,
        address: 'Av. B, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        postalCode: '22345-678',
        contactName: 'Maria Souza',
        contactEmail: 'maria@empresab.com',
        contactPhone: '(21) 98765-4321'
      },
      {
        name: 'Empresa C',
        identifier: 'empresa-c',
        organizationId: organization.id,
        address: 'Av. C, 789',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        postalCode: '30123-456',
        contactName: 'Pedro Oliveira',
        contactEmail: 'pedro@empresac.com',
        contactPhone: '(31) 98765-4321'
      }
    ];

    for (const company of companies) {
      const [createdCompany] = await db.insert(schema.companies).values(company).returning();
      console.log(`Created company with ID: ${createdCompany.id}`);
      
      // Add permissions for admin user
      await db.insert(schema.userPermissions).values({
        userId: adminUser.id,
        companyId: createdCompany.id,
        viewPermission: true,
        editPermission: true,
        deletePermission: true,
        viewPasswordPermission: true
      });

      // Create some certificates for each company
      const certificates = [
        {
          name: 'Certificado e-CNPJ A1',
          description: 'Certificado digital para pessoa jurídica do tipo A1',
          companyId: createdCompany.id,
          certificateType: 'A1',
          issuer: 'AC Certisign',
          subject: `CN=${company.name}, OU=Certificado PJ A1, O=ICP-Brasil, C=BR`,
          serialNumber: randomBytes(8).toString('hex').toUpperCase(),
          issuedDate: new Date('2023-01-15'),
          expirationDate: new Date('2024-01-15'),
          password: 'senha123', // Em produção seria criptografado
          status: 'expired',
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        },
        {
          name: 'Certificado e-CNPJ A3',
          description: 'Certificado digital para pessoa jurídica do tipo A3',
          companyId: createdCompany.id,
          certificateType: 'A3',
          issuer: 'AC Serasa',
          subject: `CN=${company.name}, OU=Certificado PJ A3, O=ICP-Brasil, C=BR`,
          serialNumber: randomBytes(8).toString('hex').toUpperCase(),
          issuedDate: new Date('2023-06-10'),
          expirationDate: new Date('2024-06-10'),
          pinCode: '123456',
          status: 'expiring',
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        },
        {
          name: 'Certificado SSL',
          description: 'Certificado SSL para site da empresa',
          companyId: createdCompany.id,
          certificateType: 'SSL',
          issuer: 'Let\'s Encrypt',
          subject: `CN=www.${company.identifier}.com.br`,
          serialNumber: randomBytes(8).toString('hex').toUpperCase(),
          issuedDate: new Date('2023-11-20'),
          expirationDate: new Date('2024-11-20'),
          status: 'valid',
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        }
      ];

      for (const cert of certificates) {
        const [createdCert] = await db.insert(schema.certificates).values(cert).returning();
        console.log(`Created certificate with ID: ${createdCert.id}`);

        // Add systems that use this certificate
        if (cert.name.includes('e-CNPJ')) {
          await db.insert(schema.certificateSystems).values({
            certificateId: createdCert.id,
            name: 'Sistema de Nota Fiscal Eletrônica',
            url: 'https://nfe.fazenda.gov.br',
            purpose: 'Emissão de notas fiscais',
            environment: 'production'
          });

          await db.insert(schema.certificateSystems).values({
            certificateId: createdCert.id,
            name: 'Portal e-CAC',
            url: 'https://cav.receita.fazenda.gov.br',
            purpose: 'Acesso a serviços da Receita Federal',
            environment: 'production'
          });
        } else if (cert.name.includes('SSL')) {
          await db.insert(schema.certificateSystems).values({
            certificateId: createdCert.id,
            name: 'Website Corporativo',
            url: `https://www.${company.identifier}.com.br`,
            purpose: 'Segurança do site institucional',
            environment: 'production'
          });
        }
      }
    }

    // Create some activity logs
    await db.insert(schema.activityLogs).values({
      userId: adminUser.id,
      organizationId: organization.id,
      action: 'create',
      entity: 'organization',
      entityId: organization.id,
      details: 'Organização criada',
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script'
    });

    // Create some security logs
    await db.insert(schema.securityLogs).values({
      userId: adminUser.id,
      organizationId: organization.id,
      eventType: 'login',
      status: 'success',
      details: { method: 'password', browser: 'Chrome', os: 'Windows' },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script'
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedData();