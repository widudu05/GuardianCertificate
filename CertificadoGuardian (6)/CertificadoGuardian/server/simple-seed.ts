import { pool } from './db';
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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    
    const adminUserResult = await client.query(`
      INSERT INTO users (username, password, email, name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['admin', adminPassword, 'admin@guardiaocd.com', 'Administrador', 'system_admin', 'active']);
    
    const adminUserId = adminUserResult.rows[0].id;
    console.log(`Created admin user with ID: ${adminUserId}`);

    // Create a test organization
    const organizationResult = await client.query(`
      INSERT INTO organizations (name, identifier, domain, status, plan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['Organização Exemplo', 'org-exemplo', 'guardiaocd.com', 'active', 'enterprise']);
    
    const organizationId = organizationResult.rows[0].id;
    console.log(`Created organization with ID: ${organizationId}`);

    // Add admin user to organization
    await client.query(`
      INSERT INTO organization_members (user_id, organization_id, role)
      VALUES ($1, $2, $3)
    `, [adminUserId, organizationId, 'owner']);

    // Create organization settings
    await client.query(`
      INSERT INTO organization_settings (organization_id, password_policy, two_factor_policy, notification_settings)
      VALUES ($1, $2, $3, $4)
    `, [
      organizationId, 
      JSON.stringify({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90,
        preventPasswordReuse: 5
      }),
      JSON.stringify({
        required: false,
        allowRememberDevice: true,
        rememberDeviceDays: 30
      }),
      JSON.stringify({
        expiryNotifications: { days: [30, 15, 7, 1] },
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false
      })
    ]);

    // Create companies
    const companies = [
      {
        name: 'Empresa A',
        identifier: 'empresa-a',
        organizationId: organizationId,
      },
      {
        name: 'Empresa B',
        identifier: 'empresa-b',
        organizationId: organizationId,
      },
      {
        name: 'Empresa C',
        identifier: 'empresa-c',
        organizationId: organizationId,
      }
    ];

    for (const company of companies) {
      const companyResult = await client.query(`
        INSERT INTO companies (name, identifier, organization_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [company.name, company.identifier, company.organizationId]);
      
      const companyId = companyResult.rows[0].id;
      console.log(`Created company with ID: ${companyId}`);
      
      // Add permissions for admin user
      await client.query(`
        INSERT INTO user_permissions (user_id, company_id, view_permission, edit_permission, delete_permission, view_password_permission)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminUserId, companyId, true, true, true, true]);
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully with an admin user and test organizations');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();