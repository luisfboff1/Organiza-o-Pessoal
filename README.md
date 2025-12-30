# Personal OS - Notion-like com IA

Personal OS é um workspace pessoal tipo Notion com IA integrada, agente inteligente, dashboard customizável e importação de dados do Notion.

## Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (Postgres + pgvector)
- **Auth:** Supabase Auth
- **IA:** Vercel AI SDK + Claude (Anthropic) + OpenAI
- **Editor:** BlockNote (Notion-like)
- **State:** TanStack Query + Zustand

## Features (Planejadas)

- ✅ **Pages + Editor:** Editor Notion-like com blocos, hierarquia de páginas, autosave
- ✅ **Busca:** Full-text search + busca semântica (RAG)
- ✅ **IA no Editor:** Slash commands (/ai rewrite, /ai summarize, etc.)
- ✅ **Agente Inteligente:** Chat com tool calling (criar páginas, tarefas, projetos, lançamentos)
- ✅ **Projetos + Kanban:** Gestão de projetos com drag & drop
- ✅ **Tasks:** Lista de tarefas com filtros e prioridades
- ✅ **Financeiro:** UX tipo Excel com navegação por teclado
- ✅ **Dashboard:** Gráficos customizáveis (shadcn charts)
- ✅ **Import CSV:** Importar dados do Notion via CSV

## Setup

### Pré-requisitos

1. **Node.js 20+**
2. **Projeto Supabase Cloud** com:
   - Extensão `vector` habilitada
   - Migrations aplicadas (ver abaixo)
3. **Variáveis de ambiente** configuradas (via Doppler ou `.env.local`)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

#### A. Criar projeto no Supabase Cloud

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Aguarde o provisionamento

#### B. Habilitar extensão vector

Execute no SQL Editor do Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### C. Aplicar migrations

Execute os arquivos em ordem no SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# IA
ANTHROPIC_API_KEY=sk-ant-[sua-chave]
OPENAI_API_KEY=sk-[sua-chave]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante:** Use Doppler para gerenciar secrets em produção.

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5. (Opcional) Gerar types TypeScript do Supabase

```bash
npx supabase gen types typescript --project-id [seu-project-id] > src/types/database.types.ts
```

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (workspace)/       # Rotas do workspace
│   └── api/               # API routes
├── features/              # Features organizadas por módulo
│   ├── pages/            # Editor + páginas
│   ├── search/           # Busca
│   ├── import/           # Import CSV
│   ├── ai-editor/        # IA no editor
│   ├── embeddings/       # RAG
│   ├── agent/            # Agente inteligente
│   ├── projects/         # Projetos + Kanban
│   ├── tasks/            # Tasks
│   ├── finance/          # Financeiro
│   └── dashboard/        # Dashboard
├── components/            # Componentes reutilizáveis
│   ├── ui/               # shadcn/ui components
│   └── providers/        # React providers
├── lib/                   # Bibliotecas e utils
│   ├── supabase/         # Clientes Supabase
│   └── utils.ts          # Helpers
└── types/                 # TypeScript types
```

## Roadmap

### FASE 0: Setup ✅
- [x] Configuração Next.js
- [x] Configuração Supabase
- [x] Providers (TanStack Query)

### FASE 1: Database + Auth ✅
- [x] Schema SQL completo
- [x] RLS policies
- [x] Trigger para criar workspace padrão

### FASE 2: Pages + Editor (Em Desenvolvimento)
- [ ] Editor BlockNote
- [ ] Sidebar com tree view
- [ ] Autosave
- [ ] CRUD de páginas

### FASE 3-10: Próximas features
Ver plano completo em `.claude/plans/polished-chasing-tome.md`

## Contribuindo

Este é um projeto pessoal em desenvolvimento ativo. Contribuições são bem-vindas!

## Licença

MIT
