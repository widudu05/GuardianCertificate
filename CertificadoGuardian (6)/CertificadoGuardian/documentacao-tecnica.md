# Documentação Técnica - Guardião de Certificados Digitais

**Data:** 09/04/2025  
**Versão:** 1.0  
**Autor:** Equipe de Desenvolvimento

## 1. Visão Geral do Sistema

O Guardião de Certificados Digitais é uma plataforma SaaS (Software as a Service) projetada para gerenciar de forma completa certificados digitais A1 e A3. O sistema permite o armazenamento seguro, monitoramento, controle de acesso e gestão do ciclo de vida de certificados digitais em ambiente cloud.

### 1.1 Propósito

O sistema tem como principal objetivo facilitar a gestão centralizada de certificados digitais para empresas, com recursos de:
- Armazenamento seguro de certificados e senhas
- Notificações de proximidade de vencimento
- Controle de acesso granular
- Suporte para múltiplas empresas (multitenancy)
- Registro detalhado de atividades (logs)

### 1.2 Tecnologias Utilizadas

#### Frontend
- React com TypeScript
- TailwindCSS para estilização
- Shadcn/UI como biblioteca de componentes
- React Query para gerenciamento de estado e requisições
- React Hook Form para formulários
- Zod para validação de dados

#### Backend
- Node.js com Express
- TypeScript
- Drizzle ORM para acesso ao banco de dados
- PostgreSQL como banco de dados relacional
- Passport.js para autenticação

## 2. Arquitetura do Sistema

### 2.1 Visão Arquitetural

O sistema segue uma arquitetura cliente-servidor com os seguintes componentes principais:

1. **Cliente (Frontend)**: Aplicação React que roda no navegador do usuário
2. **Servidor (Backend)**: API REST em Node.js/Express 
3. **Banco de Dados**: PostgreSQL para armazenamento persistente
4. **Serviços Externos**: Integrações (WhatsApp para notificações, futuro)

### 2.2 Estrutura de Diretórios

```
/
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
    └── schema.ts            # Esquema do banco de dados
```

### 2.3 Fluxo de Dados

1. O frontend faz requisições à API REST (server/routes.ts)
2. A API processa requisições através de middlewares, incluindo autenticação
3. As rotas delegam operações para a camada de storage (server/storage.ts)
4. A camada de storage interage com o banco de dados usando Drizzle ORM
5. Respostas são retornadas ao frontend em formato JSON

## 3. Banco de Dados

### 3.1 Modelagem do Banco de Dados

O banco de dados PostgreSQL possui as seguintes tabelas principais:

#### Users
Armazena informações dos usuários do sistema.
- `id`: chave primária
- `username`: nome de usuário (único)
- `email`: email do usuário (único)
- `password`: senha criptografada
- `name`: nome completo do usuário
- `role`: papel do usuário (admin, manager, user)

#### Companies
Armazena informações das empresas gerenciadas no sistema.
- `id`: chave primária
- `name`: nome da empresa
- `identifier`: CNPJ/CPF
- `created_at`: data de criação

#### Certificates
Armazena informações dos certificados digitais.
- `id`: chave primária
- `company_id`: chave estrangeira para Companies
- `name`: nome/descrição do certificado
- `entity`: nome da entidade do certificado
- `identifier`: CPF/CNPJ do titular
- `type`: tipo do certificado (A1, A3)
- `issued_date`: data de emissão
- `expiration_date`: data de expiração
- `password`: senha do certificado (criptografada)
- `file_path`: caminho do arquivo do certificado
- `created_at`: data de criação

#### UserPermissions
Define permissões de usuários para empresas específicas.
- `id`: chave primária
- `user_id`: chave estrangeira para Users
- `company_id`: chave estrangeira para Companies
- `view`: permissão de visualização
- `edit`: permissão de edição
- `delete`: permissão de exclusão
- `view_password`: permissão para visualizar senhas

#### ActivityLogs
Registra todas as atividades realizadas no sistema.
- `id`: chave primária
- `user_id`: chave estrangeira para Users
- `action`: tipo de ação (login, view, create, etc)
- `entity`: entidade afetada (user, certificate, etc)
- `entity_id`: ID da entidade afetada
- `details`: detalhes da operação
- `timestamp`: data e hora da ação
- `ip_address`: endereço IP

#### CertificateSystems
Relaciona certificados com sistemas onde são utilizados.
- `id`: chave primária
- `certificate_id`: chave estrangeira para Certificates
- `name`: nome do sistema
- `url`: URL do sistema
- `description`: descrição da utilização

### 3.2 Relacionamentos

- Usuários (1) -> (*) Permissões
- Empresas (1) -> (*) Certificados
- Empresas (1) -> (*) Permissões
- Certificados (1) -> (*) Sistemas

## 4. Componentes do Sistema

### 4.1 Autenticação e Autorização

O sistema utiliza autenticação baseada em sessões via Passport.js. O fluxo de autenticação é:

1. Usuário fornece credenciais (username/password)
2. Servidor valida credenciais contra banco de dados
3. Após validação, uma sessão é criada
4. O ID do usuário é armazenado na sessão
5. Em requisições subsequentes, o middleware de autenticação reconhece a sessão

A autorização é baseada em:
- Papel do usuário (role)
- Permissões específicas por empresa

### 4.2 Dashboard

O Dashboard apresenta uma visão geral da situação dos certificados com:
- Cards interativos mostrando estatísticas-chave
- Lista de certificados próximos ao vencimento
- Registro de atividades recentes

Os cards são clicáveis e direcionam para a página de certificados com filtros aplicados.

### 4.3 Gestão de Certificados

O módulo de gestão de certificados permite:
- Listagem com filtros por tipo, status e entidade
- Adição de novos certificados
- Visualização de detalhes e senhas (com autenticação 2FA)
- Exclusão de certificados

Mecanismos especiais de segurança são implementados para visualização de senhas, incluindo autenticação de dois fatores (2FA).

### 4.4 Logs e Auditoria

O sistema mantém um registro detalhado de todas as ações realizadas:
- Acessos ao sistema (login/logout)
- Visualizações de certificados e senhas
- Operações de criação, edição e exclusão
- Filtragem por usuário, ação e data
- Visualização detalhada de cada registro

### 4.5 Segurança

Mecanismos de segurança implementados:
- Senhas armazenadas com hash criptográfico (scrypt)
- Autenticação de dois fatores para acesso a dados sensíveis
- Criptografia de senhas de certificados
- Controle de permissões granular
- Registro detalhado de atividades

## 5. API RESTful

### 5.1 Endpoints

#### Autenticação
- `POST /api/register` - Registra um novo usuário
- `POST /api/login` - Autentica usuário
- `POST /api/logout` - Encerra sessão
- `GET /api/user` - Retorna dados do usuário autenticado

#### Empresas
- `GET /api/companies` - Lista empresas do usuário
- `GET /api/companies/:id` - Detalhes de uma empresa
- `POST /api/companies` - Cria nova empresa
- `PATCH /api/companies/:id` - Atualiza empresa
- `DELETE /api/companies/:id` - Remove empresa

#### Certificados
- `GET /api/certificates` - Lista certificados (com filtros)
- `GET /api/certificates/:id` - Detalhes de certificado
- `POST /api/certificates` - Adiciona certificado
- `PATCH /api/certificates/:id` - Atualiza certificado
- `DELETE /api/certificates/:id` - Remove certificado
- `GET /api/certificates/:id/password` - Obtém senha (requer 2FA)

#### Logs
- `GET /api/logs` - Lista logs (com filtros)

### 5.2 Formato de Resposta

As respostas da API seguem o formato JSON padrão:

**Sucesso**
```json
{
  "id": 1,
  "name": "Certificado XYZ",
  "entity": "Empresa ABC",
  "identifier": "12.345.678/0001-00",
  "type": "A1",
  "issuedDate": "2024-01-01T00:00:00.000Z",
  "expirationDate": "2025-01-01T00:00:00.000Z"
}
```

**Erro**
```json
{
  "error": "Não autorizado",
  "message": "Você não tem permissão para acessar este recurso"
}
```

## 6. Frontend

### 6.1 Estrutura de Componentes

O frontend utiliza um sistema de componentes organizados da seguinte forma:

#### Componentes UI Base (shadcn/ui)
Componentes de interface reusáveis:
- Button, Input, Select
- Dialog, Card, Skeleton
- Form, Toast

#### Componentes de Estrutura
- Layout - estrutura básica da aplicação
- Sidebar - navegação principal
- Header - barra superior com ações

#### Componentes Específicos
- Dashboard
  - StatsCard - cartões de estatísticas
  - ExpirationTable - tabela de certificados próximos ao vencimento
  - ActivityList - lista de atividades recentes
- Certificados
  - AddCertificateDialog - modal para adicionar certificados
  - TwoFactorDialog - autenticação 2FA para senhas
  - ViewPasswordDialog - visualização de senhas

### 6.2 Gerenciamento de Estado

O estado da aplicação é gerenciado através de:

1. **React Query** para dados remotos:
   - Dados de usuário e empresas
   - Listas de certificados, usuários e logs
   - Cache automático e revalidação

2. **Contextos React** para estado global:
   - AuthContext - informações de autenticação
   - Usuário atual e empresa selecionada

3. **Estado local (useState)** para componentes individuais:
   - Controle de modais e diálogos
   - Filtros e paginação

## 7. Segurança e Privacidade

### 7.1 Tratamento de Dados Sensíveis

- **Senhas de usuários:** armazenadas com hash criptográfico seguro (scrypt)
- **Senhas de certificados:** criptografadas no banco de dados
- **Arquivos de certificados:** armazenados em localização segura

### 7.2 Controle de Acesso

- Sistema de permissões baseado em papéis (roles)
- Permissões granulares por empresa
- Autenticação de dois fatores para dados sensíveis
- Verificação de permissões em todos os endpoints da API

### 7.3 Auditoria

- Registro detalhado de todas as ações
- Inclusão de timestamps e IPs
- Retenção de logs para compliance

## 8. Monitoramento e Notificações

### 8.1 Monitoramento de Certificados

O sistema monitora automaticamente:
- Certificados próximos ao vencimento (30, 15, 7 e 1 dia)
- Status de utilização dos certificados
- Tentativas de acesso não autorizadas

### 8.2 Sistema de Notificações

O sistema enviará notificações via:
- Email (configurável)
- WhatsApp (integração futura)
- Notificações no dashboard

## 9. Testes

### 9.1 Estratégia de Testes

O sistema deve ser testado em várias camadas:
- **Testes unitários:** funções e componentes isolados
- **Testes de integração:** APIs e fluxos de dados
- **Testes de usuário:** fluxos completos de uso

### 9.2 Pontos de Teste Críticos

- Autenticação e autorização
- Acesso a informações sensíveis (senhas)
- Cálculos de vencimento de certificados
- Filtros e pesquisas

## 10. Implantação

### 10.1 Requisitos de Ambiente

- Node.js 18+ (runtime)
- PostgreSQL 14+ (banco de dados)
- Mínimo de 2GB RAM para servidor
- Armazenamento para certificados digitais

### 10.2 Processo de Implantação

1. Provisionar banco de dados PostgreSQL
2. Configurar variáveis de ambiente
3. Executar migrações do banco de dados
4. Iniciar aplicação Node.js

### 10.3 Variáveis de Ambiente

- `DATABASE_URL`: string de conexão com PostgreSQL
- `SESSION_SECRET`: segredo para sessões
- `ENCRYPTION_KEY`: chave para criptografia de senhas
- `PORT`: porta HTTP (padrão: 5000)

## 11. Considerações Futuras

### 11.1 Melhorias Planejadas

- Integração com WhatsApp para notificações
- Upload de arquivos de certificados
- Integração com certificadoras
- API para integração com sistemas externos
- Backup automático diário

### 11.2 Escalabilidade

O sistema foi projetado para escalar horizontalmente:
- Banco de dados pode ser escalado separadamente
- Aplicação sem estado (stateless) permite múltiplas instâncias
- Modelo multi-tenant comporta grande número de empresas

---

## Apêndice A: Glossário

- **Certificado A1:** certificado digital armazenado no computador
- **Certificado A3:** certificado digital armazenado em dispositivo externo (token, smartcard)
- **2FA:** autenticação de dois fatores, método que requer dois tipos de verificação
- **Multi-tenant:** arquitetura que permite atender múltiplos clientes (empresas) em uma única instância

## Apêndice B: Credenciais de Teste

Usuário de teste para ambiente de desenvolvimento:

- **Username:** teste
- **Senha:** senha123
- **Perfil:** Administrador