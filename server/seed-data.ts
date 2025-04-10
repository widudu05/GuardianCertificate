import { db } from './db';
import { storage } from './storage';
import { hashPassword } from './auth';
import { encrypt } from './auth';
import { 
  companies, 
  certificates, 
  activityLogs, 
  userPermissions,
  certificateSystems
} from '@shared/schema';

async function seedData() {
  console.log('Populando o banco de dados com dados de exemplo...');

  // Verificar se já existem dados
  const existingCompanies = await storage.getCompanies();
  if (existingCompanies.length > 0) {
    console.log('Já existem dados no banco. Ignorando seed.');
    return;
  }

  // Usuário admin já deve existir, obter o ID
  const admin = await storage.getUserByUsername('admin');
  if (!admin) {
    console.log('Usuário admin não encontrado. Execute setup.ts primeiro.');
    return;
  }

  console.log('Criando empresas...');
  // Criar empresas
  const empresas = [
    {
      name: 'Contabilidade Exemplo Ltda',
      identifier: '12.345.678/0001-99'
    },
    {
      name: 'Comércio Digital S/A',
      identifier: '98.765.432/0001-10'
    },
    {
      name: 'Indústria Nacional Ltda',
      identifier: '45.678.901/0001-23'
    },
    {
      name: 'Transportes Rápidos S/A',
      identifier: '34.567.890/0001-45'
    }
  ];

  const empresasIds = [];
  
  for (const empresa of empresas) {
    const novaEmpresa = await storage.createCompany(empresa);
    empresasIds.push(novaEmpresa.id);
    
    // Criar permissão para o admin
    await storage.setUserPermission({
      userId: admin.id,
      companyId: novaEmpresa.id,
      view: true,
      edit: true,
      delete: true,
      viewPassword: true
    });
    
    console.log(`Empresa criada: ${novaEmpresa.name}`);
  }

  console.log('Criando certificados...');
  // Criar certificados
  const hoje = new Date();
  const certificados = [
    {
      name: 'e-CNPJ A1 Contabilidade',
      type: 'A1' as const,
      companyId: empresasIds[0],
      entity: 'Empresa',
      identifier: '12.345.678/0001-99',
      issuedDate: new Date(hoje.getFullYear() - 1, 5, 15),
      expirationDate: new Date(hoje.getFullYear() + 1, 5, 15),
      password: encrypt('senha123'),
      filePath: 'cert_contabilidade.pfx'
    },
    {
      name: 'e-CPF A3 Responsável',
      type: 'A3' as const,
      companyId: empresasIds[0],
      entity: 'Pessoa Física',
      identifier: '123.456.789-10',
      issuedDate: new Date(hoje.getFullYear() - 1, 2, 10),
      expirationDate: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 10), // Expira em um mês
      password: encrypt('token456'),
      filePath: 'ecpf_responsavel.pfx'
    },
    {
      name: 'e-CNPJ A1 Comércio Digital',
      type: 'A1' as const,
      companyId: empresasIds[1],
      entity: 'Empresa',
      identifier: '98.765.432/0001-10',
      issuedDate: new Date(hoje.getFullYear() - 1, 7, 20),
      expirationDate: new Date(hoje.getFullYear() - 1, 7, 20), // Já expirado
      password: encrypt('digital789'),
      filePath: 'cert_comercio.pfx'
    },
    {
      name: 'e-CNPJ A3 Industria',
      type: 'A3' as const,
      companyId: empresasIds[2],
      entity: 'Empresa',
      identifier: '45.678.901/0001-23',
      issuedDate: new Date(hoje.getFullYear() - 2, 3, 5),
      expirationDate: new Date(hoje.getFullYear() + 1, 3, 5),
      password: encrypt('seguro888'),
      filePath: 'cert_industria.pfx'
    },
    {
      name: 'NFe A1 Transportes',
      type: 'A1' as const,
      companyId: empresasIds[3],
      entity: 'Empresa',
      identifier: '34.567.890/0001-45',
      issuedDate: new Date(hoje.getFullYear(), 0, 10),
      expirationDate: new Date(hoje.getFullYear() + 1, 0, 10),
      password: encrypt('transporte123'),
      filePath: 'cert_transportes.pfx'
    }
  ];

  const certificadosIds = [];
  
  for (const certificado of certificados) {
    const novoCertificado = await storage.createCertificate(certificado);
    certificadosIds.push(novoCertificado.id);
    
    console.log(`Certificado criado: ${novoCertificado.name}`);
  }

  console.log('Criando sistemas...');
  // Criar sistemas para os certificados
  const sistemas = [
    {
      name: 'Receita Federal - e-CAC',
      url: 'https://cav.receita.fazenda.gov.br/autenticacao/login',
      certificateId: certificadosIds[0]
    },
    {
      name: 'Prefeitura de Campinas - NFSe',
      url: 'https://novanfse.campinas.sp.gov.br/notafiscal/paginas/portal/index.html',
      certificateId: certificadosIds[0]
    },
    {
      name: 'Prefeitura de Barueri - NFe',
      url: 'https://www.barueri.sp.gov.br/nfe/wfPrincipalNF.aspx',
      certificateId: certificadosIds[1]
    },
    {
      name: 'Receita Federal - e-CAC',
      url: 'https://cav.receita.fazenda.gov.br/autenticacao/login',
      certificateId: certificadosIds[2]
    },
    {
      name: 'SEFAZ - NFe',
      url: 'https://www.nfe.fazenda.gov.br/portal/',
      certificateId: certificadosIds[3]
    }
  ];
  
  for (const sistema of sistemas) {
    const novoSistema = await storage.createCertificateSystem(sistema);
    console.log(`Sistema criado: ${novoSistema.name} para certificado ID ${novoSistema.certificateId}`);
  }

  console.log('Criando logs de atividade...');
  // Criar logs de atividade simulando acessos
  const hoje_timestamp = hoje.getTime();
  const umDiaEmMs = 24 * 60 * 60 * 1000;
  
  const logs = [
    // Logs do dia atual
    {
      userId: admin.id,
      action: 'view' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[0],
      details: { certificateName: certificados[0].name },
      ipAddress: '192.168.1.100',
      createdAt: new Date(hoje_timestamp - 2 * 60 * 60 * 1000) // 2 horas atrás
    },
    {
      userId: admin.id,
      action: 'view_password' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[0],
      details: { certificateName: certificados[0].name },
      ipAddress: '192.168.1.100',
      createdAt: new Date(hoje_timestamp - 2 * 60 * 60 * 1000 + 5 * 60 * 1000) // 1h55min atrás
    },
    {
      userId: admin.id,
      action: 'view' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[1],
      details: { certificateName: certificados[1].name },
      ipAddress: '192.168.1.100',
      createdAt: new Date(hoje_timestamp - 1 * 60 * 60 * 1000) // 1 hora atrás
    },
    // Logs de ontem
    {
      userId: admin.id,
      action: 'view' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[2],
      details: { certificateName: certificados[2].name },
      ipAddress: '192.168.1.101',
      createdAt: new Date(hoje_timestamp - umDiaEmMs) // Ontem
    },
    {
      userId: admin.id,
      action: 'view_password' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[3],
      details: { certificateName: certificados[3].name },
      ipAddress: '192.168.1.101',
      createdAt: new Date(hoje_timestamp - umDiaEmMs + 3 * 60 * 60 * 1000) // Ontem + 3h
    },
    // Logs da semana passada
    {
      userId: admin.id,
      action: 'view' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[4],
      details: { certificateName: certificados[4].name },
      ipAddress: '192.168.1.102',
      createdAt: new Date(hoje_timestamp - 7 * umDiaEmMs) // 7 dias atrás
    },
    {
      userId: admin.id,
      action: 'view_password' as const,
      entity: 'certificate' as const,
      entityId: certificadosIds[4],
      details: { certificateName: certificados[4].name },
      ipAddress: '192.168.1.102',
      createdAt: new Date(hoje_timestamp - 7 * umDiaEmMs + 1 * 60 * 60 * 1000) // 7 dias atrás + 1h
    }
  ];
  
  for (const log of logs) {
    const novoLog = await storage.createActivityLog(log);
    console.log(`Log criado: ${novoLog.action} ${novoLog.entity} ${novoLog.entityId}`);
  }

  console.log('Dados de exemplo criados com sucesso!');
}

// Executar a função de seed
seedData()
  .catch(console.error)
  .finally(() => {
    console.log('Processo de seed finalizado.');
    process.exit(0);
  });