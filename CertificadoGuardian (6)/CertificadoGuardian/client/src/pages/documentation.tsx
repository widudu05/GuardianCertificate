import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Save, Printer } from 'lucide-react';

export default function Documentation() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    // Carregar o conteúdo da documentação de um arquivo Markdown
    fetch('/documentacao-tecnica.md')
      .then(response => response.text())
      .then(text => {
        setContent(text);
      })
      .catch(error => {
        console.error('Erro ao carregar documentação:', error);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documentacao-tecnica.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Documentação Técnica</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Baixar Markdown
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto print:shadow-none">
          <article className="prose prose-lg max-w-none">
            <h1>Documentação Técnica - Guardião de Certificados Digitais</h1>
            
            <p><strong>Data:</strong> 09/04/2025<br />
            <strong>Versão:</strong> 1.0<br />
            <strong>Autor:</strong> Equipe de Desenvolvimento</p>
            
            <h2>1. Visão Geral do Sistema</h2>
            
            <p>O Guardião de Certificados Digitais é uma plataforma SaaS (Software as a Service) projetada para gerenciar de forma completa certificados digitais A1 e A3. O sistema permite o armazenamento seguro, monitoramento, controle de acesso e gestão do ciclo de vida de certificados digitais em ambiente cloud.</p>
            
            <h3>1.1 Propósito</h3>
            
            <p>O sistema tem como principal objetivo facilitar a gestão centralizada de certificados digitais para empresas, com recursos de:</p>
            <ul>
                <li>Armazenamento seguro de certificados e senhas</li>
                <li>Notificações de proximidade de vencimento</li>
                <li>Controle de acesso granular</li>
                <li>Suporte para múltiplas empresas (multitenancy)</li>
                <li>Registro detalhado de atividades (logs)</li>
            </ul>
            
            <h3>1.2 Tecnologias Utilizadas</h3>
            
            <h4>Frontend</h4>
            <ul>
                <li>React com TypeScript</li>
                <li>TailwindCSS para estilização</li>
                <li>Shadcn/UI como biblioteca de componentes</li>
                <li>React Query para gerenciamento de estado e requisições</li>
                <li>React Hook Form para formulários</li>
                <li>Zod para validação de dados</li>
            </ul>
            
            <h4>Backend</h4>
            <ul>
                <li>Node.js com Express</li>
                <li>TypeScript</li>
                <li>Drizzle ORM para acesso ao banco de dados</li>
                <li>PostgreSQL como banco de dados relacional</li>
                <li>Passport.js para autenticação</li>
            </ul>
            
            <h2>2. Arquitetura do Sistema</h2>
            
            <h3>2.1 Visão Arquitetural</h3>
            
            <p>O sistema segue uma arquitetura cliente-servidor com os seguintes componentes principais:</p>
            
            <ol>
                <li><strong>Cliente (Frontend)</strong>: Aplicação React que roda no navegador do usuário</li>
                <li><strong>Servidor (Backend)</strong>: API REST em Node.js/Express</li>
                <li><strong>Banco de Dados</strong>: PostgreSQL para armazenamento persistente</li>
                <li><strong>Serviços Externos</strong>: Integrações (WhatsApp para notificações, futuro)</li>
            </ol>
            
            <h3>2.2 Estrutura de Diretórios</h3>
            
            <pre><code>{`/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Contextos React (Auth, etc)
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Funções utilitárias
│   │   ├── pages/           # Páginas da aplicação
│   │   └── main.tsx         # Ponto de entrada da aplicação
├── server/                  # Backend Express
│   ├── auth.ts              # Autenticação
│   ├── db.ts                # Conexão com banco de dados
│   ├── routes.ts            # Rotas da API
│   ├── storage.ts           # Camada de acesso aos dados
│   └── index.ts             # Ponto de entrada do servidor
└── shared/                  # Código compartilhado
    └── schema.ts            # Esquema do banco de dados`}</code></pre>
            
            <h3>2.3 Fluxo de Dados</h3>
            
            <ol>
                <li>O frontend faz requisições à API REST (server/routes.ts)</li>
                <li>A API processa requisições através de middlewares, incluindo autenticação</li>
                <li>As rotas delegam operações para a camada de storage (server/storage.ts)</li>
                <li>A camada de storage interage com o banco de dados usando Drizzle ORM</li>
                <li>Respostas são retornadas ao frontend em formato JSON</li>
            </ol>
            
            <h2>3. Banco de Dados</h2>
            
            <h3>3.1 Modelagem do Banco de Dados</h3>
            
            <p>O banco de dados PostgreSQL possui as seguintes tabelas principais:</p>
            
            <h4>Users</h4>
            <p>Armazena informações dos usuários do sistema.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>username</code>: nome de usuário (único)</li>
                <li><code>email</code>: email do usuário (único)</li>
                <li><code>password</code>: senha criptografada</li>
                <li><code>name</code>: nome completo do usuário</li>
                <li><code>role</code>: papel do usuário (admin, manager, user)</li>
            </ul>
            
            <h4>Companies</h4>
            <p>Armazena informações das empresas gerenciadas no sistema.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>name</code>: nome da empresa</li>
                <li><code>identifier</code>: CNPJ/CPF</li>
                <li><code>created_at</code>: data de criação</li>
            </ul>
            
            <h4>Certificates</h4>
            <p>Armazena informações dos certificados digitais.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>company_id</code>: chave estrangeira para Companies</li>
                <li><code>name</code>: nome/descrição do certificado</li>
                <li><code>entity</code>: nome da entidade do certificado</li>
                <li><code>identifier</code>: CPF/CNPJ do titular</li>
                <li><code>type</code>: tipo do certificado (A1, A3)</li>
                <li><code>issued_date</code>: data de emissão</li>
                <li><code>expiration_date</code>: data de expiração</li>
                <li><code>password</code>: senha do certificado (criptografada)</li>
                <li><code>file_path</code>: caminho do arquivo do certificado</li>
                <li><code>created_at</code>: data de criação</li>
            </ul>
            
            <h4>UserPermissions</h4>
            <p>Define permissões de usuários para empresas específicas.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>user_id</code>: chave estrangeira para Users</li>
                <li><code>company_id</code>: chave estrangeira para Companies</li>
                <li><code>view</code>: permissão de visualização</li>
                <li><code>edit</code>: permissão de edição</li>
                <li><code>delete</code>: permissão de exclusão</li>
                <li><code>view_password</code>: permissão para visualizar senhas</li>
            </ul>
            
            <h4>ActivityLogs</h4>
            <p>Registra todas as atividades realizadas no sistema.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>user_id</code>: chave estrangeira para Users</li>
                <li><code>action</code>: tipo de ação (login, view, create, etc)</li>
                <li><code>entity</code>: entidade afetada (user, certificate, etc)</li>
                <li><code>entity_id</code>: ID da entidade afetada</li>
                <li><code>details</code>: detalhes da operação</li>
                <li><code>timestamp</code>: data e hora da ação</li>
                <li><code>ip_address</code>: endereço IP</li>
            </ul>
            
            <h4>CertificateSystems</h4>
            <p>Relaciona certificados com sistemas onde são utilizados.</p>
            <ul>
                <li><code>id</code>: chave primária</li>
                <li><code>certificate_id</code>: chave estrangeira para Certificates</li>
                <li><code>name</code>: nome do sistema</li>
                <li><code>url</code>: URL do sistema</li>
                <li><code>description</code>: descrição da utilização</li>
            </ul>
            
            <h3>3.2 Relacionamentos</h3>
            
            <ul>
                <li>Usuários (1) {'->'} (*) Permissões</li>
                <li>Empresas (1) {'->'} (*) Certificados</li>
                <li>Empresas (1) {'->'} (*) Permissões</li>
                <li>Certificados (1) {'->'} (*) Sistemas</li>
            </ul>
            
            <h2>4. Componentes do Sistema</h2>
            
            <h3>4.1 Autenticação e Autorização</h3>
            
            <p>O sistema utiliza autenticação baseada em sessões via Passport.js. O fluxo de autenticação é:</p>
            
            <ol>
                <li>Usuário fornece credenciais (username/password)</li>
                <li>Servidor valida credenciais contra banco de dados</li>
                <li>Após validação, uma sessão é criada</li>
                <li>O ID do usuário é armazenado na sessão</li>
                <li>Em requisições subsequentes, o middleware de autenticação reconhece a sessão</li>
            </ol>
            
            <p>A autorização é baseada em:</p>
            <ul>
                <li>Papel do usuário (role)</li>
                <li>Permissões específicas por empresa</li>
            </ul>
            
            <h3>4.2 Dashboard</h3>
            
            <p>O Dashboard apresenta uma visão geral da situação dos certificados com:</p>
            <ul>
                <li>Cards interativos mostrando estatísticas-chave</li>
                <li>Lista de certificados próximos ao vencimento</li>
                <li>Registro de atividades recentes</li>
            </ul>
            
            <p>Os cards são clicáveis e direcionam para a página de certificados com filtros aplicados.</p>
            
            <h3>4.3 Gestão de Certificados</h3>
            
            <p>O módulo de gestão de certificados permite:</p>
            <ul>
                <li>Listagem com filtros por tipo, status e entidade</li>
                <li>Adição de novos certificados</li>
                <li>Visualização de detalhes e senhas (com autenticação 2FA)</li>
                <li>Exclusão de certificados</li>
            </ul>
            
            <p>Mecanismos especiais de segurança são implementados para visualização de senhas, incluindo autenticação de dois fatores (2FA).</p>
            
            <h3>4.4 Logs e Auditoria</h3>
            
            <p>O sistema mantém um registro detalhado de todas as ações realizadas:</p>
            <ul>
                <li>Acessos ao sistema (login/logout)</li>
                <li>Visualizações de certificados e senhas</li>
                <li>Operações de criação, edição e exclusão</li>
                <li>Filtragem por usuário, ação e data</li>
                <li>Visualização detalhada de cada registro</li>
            </ul>
            
            <h3>4.5 Segurança</h3>
            
            <p>Mecanismos de segurança implementados:</p>
            <ul>
                <li>Senhas armazenadas com hash criptográfico (scrypt)</li>
                <li>Autenticação de dois fatores para acesso a dados sensíveis</li>
                <li>Criptografia de senhas de certificados</li>
                <li>Controle de permissões granular</li>
                <li>Registro detalhado de atividades</li>
            </ul>
            
            <h2>5. API RESTful</h2>
            
            <h3>5.1 Endpoints</h3>
            
            <h4>Autenticação</h4>
            <ul>
                <li><code>POST /api/register</code> - Registra um novo usuário</li>
                <li><code>POST /api/login</code> - Autentica usuário</li>
                <li><code>POST /api/logout</code> - Encerra sessão</li>
                <li><code>GET /api/user</code> - Retorna dados do usuário autenticado</li>
            </ul>
            
            <h4>Empresas</h4>
            <ul>
                <li><code>GET /api/companies</code> - Lista empresas do usuário</li>
                <li><code>GET /api/companies/:id</code> - Detalhes de uma empresa</li>
                <li><code>POST /api/companies</code> - Cria nova empresa</li>
                <li><code>PATCH /api/companies/:id</code> - Atualiza empresa</li>
                <li><code>DELETE /api/companies/:id</code> - Remove empresa</li>
            </ul>
            
            <h4>Certificados</h4>
            <ul>
                <li><code>GET /api/certificates</code> - Lista certificados (com filtros)</li>
                <li><code>GET /api/certificates/:id</code> - Detalhes de certificado</li>
                <li><code>POST /api/certificates</code> - Adiciona certificado</li>
                <li><code>PATCH /api/certificates/:id</code> - Atualiza certificado</li>
                <li><code>DELETE /api/certificates/:id</code> - Remove certificado</li>
                <li><code>GET /api/certificates/:id/password</code> - Obtém senha (requer 2FA)</li>
            </ul>
            
            <h4>Logs</h4>
            <ul>
                <li><code>GET /api/logs</code> - Lista logs (com filtros)</li>
            </ul>
            
            <h3>5.2 Formato de Resposta</h3>
            
            <p>As respostas da API seguem o formato JSON padrão:</p>
            
            <p><strong>Sucesso</strong></p>
            <pre><code>{'{\n  "id": 1,\n  "name": "Certificado XYZ",\n  "entity": "Empresa ABC",\n  "identifier": "12.345.678/0001-00",\n  "type": "A1",\n  "issuedDate": "2024-01-01T00:00:00.000Z",\n  "expirationDate": "2025-01-01T00:00:00.000Z"\n}'}</code></pre>
            
            <p><strong>Erro</strong></p>
            <pre><code>{'{\n  "error": "Não autorizado",\n  "message": "Você não tem permissão para acessar este recurso"\n}'}</code></pre>
            
            <h2>6. Frontend</h2>
            
            <h3>6.1 Estrutura de Componentes</h3>
            
            <p>O frontend utiliza um sistema de componentes organizados da seguinte forma:</p>
            
            <h4>Componentes UI Base (shadcn/ui)</h4>
            <p>Componentes de interface reusáveis:</p>
            <ul>
                <li>Button, Input, Select</li>
                <li>Dialog, Card, Skeleton</li>
                <li>Form, Toast</li>
            </ul>
            
            <h4>Componentes de Estrutura</h4>
            <ul>
                <li>Layout - estrutura básica da aplicação</li>
                <li>Sidebar - navegação principal</li>
                <li>Header - barra superior com ações</li>
            </ul>
            
            <h4>Componentes Específicos</h4>
            <ul>
                <li>Dashboard
                    <ul>
                        <li>StatsCard - cartões de estatísticas</li>
                        <li>ExpirationTable - tabela de certificados próximos ao vencimento</li>
                        <li>ActivityList - lista de atividades recentes</li>
                    </ul>
                </li>
                <li>Certificados
                    <ul>
                        <li>AddCertificateDialog - modal para adicionar certificados</li>
                        <li>TwoFactorDialog - autenticação 2FA para senhas</li>
                        <li>ViewPasswordDialog - visualização de senhas</li>
                    </ul>
                </li>
            </ul>
            
            <h3>6.2 Gerenciamento de Estado</h3>
            
            <p>O estado da aplicação é gerenciado através de:</p>
            
            <ol>
                <li><strong>React Query</strong> para dados remotos:
                    <ul>
                        <li>Dados de usuário e empresas</li>
                        <li>Listas de certificados, usuários e logs</li>
                        <li>Cache automático e revalidação</li>
                    </ul>
                </li>
                <li><strong>Contextos React</strong> para estado global:
                    <ul>
                        <li>AuthContext - informações de autenticação</li>
                        <li>Usuário atual e empresa selecionada</li>
                    </ul>
                </li>
                <li><strong>Estado local (useState)</strong> para componentes individuais:
                    <ul>
                        <li>Controle de modais e diálogos</li>
                        <li>Filtros e paginação</li>
                    </ul>
                </li>
            </ol>
            
            <h2>7. Segurança e Privacidade</h2>
            
            <h3>7.1 Tratamento de Dados Sensíveis</h3>
            
            <ul>
                <li><strong>Senhas de usuários:</strong> armazenadas com hash criptográfico seguro (scrypt)</li>
                <li><strong>Senhas de certificados:</strong> criptografadas no banco de dados</li>
                <li><strong>Arquivos de certificados:</strong> armazenados em localização segura</li>
            </ul>
            
            <h3>7.2 Controle de Acesso</h3>
            
            <ul>
                <li>Sistema de permissões baseado em papéis (roles)</li>
                <li>Permissões granulares por empresa</li>
                <li>Autenticação de dois fatores para dados sensíveis</li>
                <li>Verificação de permissões em todos os endpoints da API</li>
            </ul>
            
            <h3>7.3 Auditoria</h3>
            
            <ul>
                <li>Registro detalhado de todas as ações</li>
                <li>Inclusão de timestamps e IPs</li>
                <li>Retenção de logs para compliance</li>
            </ul>
            
            <h2>8. Monitoramento e Notificações</h2>
            
            <h3>8.1 Monitoramento de Certificados</h3>
            
            <p>O sistema monitora automaticamente:</p>
            <ul>
                <li>Certificados próximos ao vencimento (30, 15, 7 e 1 dia)</li>
                <li>Status de utilização dos certificados</li>
                <li>Tentativas de acesso não autorizadas</li>
            </ul>
            
            <h3>8.2 Sistema de Notificações</h3>
            
            <p>O sistema enviará notificações via:</p>
            <ul>
                <li>Email (configurável)</li>
                <li>WhatsApp (integração futura)</li>
                <li>Notificações no dashboard</li>
            </ul>
            
            <h2>9. Testes</h2>
            
            <h3>9.1 Estratégia de Testes</h3>
            
            <p>O sistema deve ser testado em várias camadas:</p>
            <ul>
                <li><strong>Testes unitários:</strong> funções e componentes isolados</li>
                <li><strong>Testes de integração:</strong> APIs e fluxos de dados</li>
                <li><strong>Testes de usuário:</strong> fluxos completos de uso</li>
            </ul>
            
            <h3>9.2 Pontos de Teste Críticos</h3>
            
            <ul>
                <li>Autenticação e autorização</li>
                <li>Acesso a informações sensíveis (senhas)</li>
                <li>Cálculos de vencimento de certificados</li>
                <li>Filtros e pesquisas</li>
            </ul>
            
            <h2>10. Implantação</h2>
            
            <h3>10.1 Requisitos de Ambiente</h3>
            
            <ul>
                <li>Node.js 18+ (runtime)</li>
                <li>PostgreSQL 14+ (banco de dados)</li>
                <li>Mínimo de 2GB RAM para servidor</li>
                <li>Armazenamento para certificados digitais</li>
            </ul>
            
            <h3>10.2 Processo de Implantação</h3>
            
            <ol>
                <li>Provisionar banco de dados PostgreSQL</li>
                <li>Configurar variáveis de ambiente</li>
                <li>Executar migrações do banco de dados</li>
                <li>Iniciar aplicação Node.js</li>
            </ol>
            
            <h3>10.3 Variáveis de Ambiente</h3>
            
            <ul>
                <li><code>DATABASE_URL</code>: string de conexão com PostgreSQL</li>
                <li><code>SESSION_SECRET</code>: segredo para sessões</li>
                <li><code>ENCRYPTION_KEY</code>: chave para criptografia de senhas</li>
                <li><code>PORT</code>: porta HTTP (padrão: 5000)</li>
            </ul>
            
            <h2>11. Considerações Futuras</h2>
            
            <h3>11.1 Melhorias Planejadas</h3>
            
            <ul>
                <li>Integração com WhatsApp para notificações</li>
                <li>Upload de arquivos de certificados</li>
                <li>Integração com certificadoras</li>
                <li>API para integração com sistemas externos</li>
                <li>Backup automático diário</li>
            </ul>
            
            <h3>11.2 Escalabilidade</h3>
            
            <p>O sistema foi projetado para escalar horizontalmente:</p>
            <ul>
                <li>Banco de dados pode ser escalado separadamente</li>
                <li>Aplicação sem estado (stateless) permite múltiplas instâncias</li>
                <li>Modelo multi-tenant comporta grande número de empresas</li>
            </ul>
            
            <hr />
            
            <h2>Apêndice A: Glossário</h2>
            
            <ul>
                <li><strong>Certificado A1:</strong> certificado digital armazenado no computador</li>
                <li><strong>Certificado A3:</strong> certificado digital armazenado em dispositivo externo (token, smartcard)</li>
                <li><strong>2FA:</strong> autenticação de dois fatores, método que requer dois tipos de verificação</li>
                <li><strong>Multi-tenant:</strong> arquitetura que permite atender múltiplos clientes (empresas) em uma única instância</li>
            </ul>
            
            <h2>Apêndice B: Credenciais de Teste</h2>
            
            <p>Usuário de teste para ambiente de desenvolvimento:</p>
            
            <ul>
                <li><strong>Username:</strong> teste</li>
                <li><strong>Senha:</strong> senha123</li>
                <li><strong>Perfil:</strong> Administrador</li>
            </ul>
          </article>
        </div>
      </div>
    </Layout>
  );
}