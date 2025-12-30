# PROMPT CENTRAL — Notion-like Personal OS + IA Agent + Dashboard + Import Notion CSV (Supabase + pgvector)

Você é um engenheiro sênior full-stack e arquiteto de software.  
Seu objetivo é construir um webapp pessoal no estilo “Notion-like” (editor de blocos, páginas hierárquicas, projetos, docs, resumos e finanças), com **IA integrada** e um **Agente Inteligente** em formato de chat (uma “caixa de conversa”) capaz de executar ações no sistema (criar, editar, resumir, organizar, gerar tarefas, lançar despesas, etc.), além de um **Dashboard de gráficos** com shadcn/ui charts totalmente customizável no front-end.

**IMPORTANTE:** atualmente meus dados estão no Notion. Eu vou exportar as tabelas do Notion em `.csv` e o webapp precisa:
1) importar esses arquivos e popular o banco
2) manter consistência entre tabelas e relações (projetos, finanças, tarefas)
3) permitir re-importação incremental (upsert) e mapeamento de colunas
4) suportar importação de múltiplos CSVs (projetos, finanças, tarefas) e reconciliar relações entre eles

O projeto deve ser modular, escalável, seguro (RLS), performático e fácil de manter.

---

## 1) Objetivo do Produto (Product Vision)
Construir um "Personal OS" web:
- Páginas em árvore (hierarquia) estilo Notion
- Editor Notion-like (blocos)
- Projetos + documentos + resumos + notas
- Módulo de tarefas e projetos (kanban + lista)
- Módulo financeiro (entrada/saída/categoria + relações)
- Busca textual + busca semântica (RAG)
- IA integrada dentro do editor e agente central
- **Agente Inteligente (Chatbox)** que:
  - conversa com o usuário
  - acessa o contexto do workspace (RAG)
  - executa ações via tool calling com segurança
  - cria páginas, tasks, projetos e lançamentos financeiros
  - conecta “projetos ↔ finanças ↔ tarefas ↔ páginas”
  - gera resumos, relatórios e insights
  - sempre cita fontes (links para páginas/projetos/lançamentos)

- **Dashboard de gráficos**:
  - criar gráficos customizáveis (frontend)
  - criar widgets e dashboards por projeto
  - gráficos de finanças, produtividade, tarefas, projetos
  - salvar configurações, filtros e layout do dashboard

**Não construir colaboração em tempo real no MVP.**  
O foco é um MVP sólido e extensível.

---

## 2) Stack Obrigatória (OBRIGATÓRIA)
### Frontend
- Next.js 15+ (App Router)
- TypeScript (strict)
- TailwindCSS
- shadcn/ui (componentes)
- TanStack Query (server state, cache, revalidação)
- Zustand (estado local)
- Framer Motion (animações suaves, opcional)

### Editor
- BlockNote (editor Notion-like)
- Persistência com autosave + debounce

### Backend
- Next.js API Routes + Server Actions (monólito modular)
- Supabase como backend completo:
  - Postgres (DB)
  - Supabase Auth (login)
  - Supabase Storage (arquivos)
  - pgvector (vector store)

### IA
- Vercel AI SDK (streaming, tool calling, UI hooks)
- Provider primário: Anthropic (Claude)
- Fallback: OpenAI (opcional)
- Zod schemas para validar inputs/outputs e tools
- Implementar um Agent com tool calling capaz de operar no sistema

---

## 3) Requisitos Funcionais (Features)
### 3.1 Auth + Workspace
1) Autenticação via Supabase Auth (email/senha + OAuth)
2) Workspaces (no MVP, 1 workspace por usuário, mas modelar para multi-workspace)

### 3.2 Páginas + Editor (Notion-like)
3) Tree de páginas:
   - parent_id para hierarquia
   - sidebar navigation
4) Editor de blocos BlockNote:
   - salvar JSON do documento no banco (content_json)
   - extrair uma versão plain-text (content_text) para search/embeddings
   - autosave com debounce
5) Upload de anexos (Supabase Storage):
   - imagens no editor
   - arquivos para páginas

### 3.3 Busca
6) Busca textual (FTS):
   - pages.title + pages.content_text
7) Busca semântica (RAG):
   - gerar embeddings por chunks
   - armazenar embeddings no Supabase (pgvector)
   - filtrar por workspace (RLS)

### 3.4 IA Dentro do Editor
8) Slash commands / ações IA:
   - /ai rewrite
   - /ai summarize
   - /ai extract tasks
   - /ai improve writing

### 3.5 Agente Inteligente (Chatbox)
9) Chat lateral ou modal (Chatbox persistente):
   - chat com o workspace
   - retrieval (RAG) para contexto
   - resposta com citações e links de fonte
   - tool calling para executar ações no sistema:
     - criar páginas
     - atualizar páginas
     - criar projetos
     - criar tasks
     - criar lançamentos financeiros
     - relacionar entidades
   - O agente deve pedir confirmação para ações destrutivas (ex: delete, overwrite)

### 3.6 Projetos + Kanban
10) Módulo de projetos:
   - projetos com status (backlog, in-progress, done)
   - visão Kanban para projetos
   - cada projeto pode ter:
     - tarefas
     - páginas relacionadas
     - lançamentos financeiros vinculados
     - tags/categorias
     - indicadores no dashboard
   - permitir arrastar cards no kanban (drag & drop)

### 3.7 Tarefas
11) Módulo tasks:
   - status: todo / doing / done
   - prioridade
   - due_date
   - relacionar task com:
     - project_id
     - page_id (opcional)

### 3.8 Financeiro (com UX tipo Excel)
12) Módulo financeiro:
   - entradas e saídas
   - categoria
   - data
   - valor
   - observação
   - **UX tipo planilha/Excel**:
     - inserir rapidamente
     - navegar com teclado
     - edição inline (cell editing)
     - copiar/colar linhas
     - validação e máscaras (moeda, data)
     - dropdown de categorias e projetos
   - permitir relacionar lançamentos:
     - com project_id
     - com page_id (opcional)
     - com tags

### 3.9 Importação de dados do Notion via CSV (OBRIGATÓRIO)
13) Módulo Import CSV:
   - upload de arquivos `.csv` exportados do Notion
   - telas de import com mapeamento de colunas:
     - o usuário escolhe qual coluna do CSV corresponde a qual campo do banco
   - detectar tipo de tabela (finanças, projetos, tasks, páginas) ou permitir seleção manual
   - preview antes de importar (exibir primeiras 50 linhas)
   - permitir:
     - importar como "novo"
     - re-importar como "atualização"
     - upsert por chave (ex: notion_id, ou combinação de title+date+amount)
   - lidar com tipos:
     - data
     - moeda
     - tags multi-valor
   - criar um campo `source` e `source_id` (notion) para manter rastreabilidade
   - após importar, gerar embeddings para páginas/projetos/notas relevantes
   - importar relações:
     - se o CSV tiver colunas de relação do Notion (ex: "Projeto", "Relacionados"), mapear e reconciliar
     - se não tiver, permitir o usuário fazer linkagem depois no app

### 3.10 Dashboard (Gráficos Customizáveis)
14) Dashboard customizável:
   - criar "cards" de gráficos (widgets)
   - escolher tipo: bar, line, area, pie
   - escolher fonte de dados:
     - finance_entries (por data/categoria/projeto)
     - tasks (por status/prioridade/projeto)
     - projects (por status, progresso, custo)
     - pages (quantidade criadas por mês)
   - escolher filtros:
     - período (date range)
     - categoria
     - projeto
     - tags
   - salvar configurações no DB:
     - layout (grid)
     - cada widget: tipo, query, filtros, título, posição
   - UI: usar shadcn charts (baseado em recharts)
   - dashboards por:
     - workspace
     - projeto (dashboard específico de um projeto)

---

## 4) Requisitos Não Funcionais
- Performance: salvar rápido; embeddings em background sempre que possível
- Segurança: RLS em todas as tabelas (workspace isolation)
- Privacidade: o RAG nunca pode trazer dados de outro workspace
- Modularidade: features organizadas em `/features/*`
- Observabilidade: logs claros nas rotas de IA; tratar erros e timeouts
- Testabilidade: funções puras para chunking, retrieval, tool call handlers
- Portabilidade futura: export pages como Markdown
- Importação resiliente: importar com rollback/transactions quando possível

---

## 5) Restrições / OBRIGAÇÕES (Hard Rules)
- Não usar Firebase
- Não usar MongoDB
- Sempre usar TypeScript strict
- Sempre validar inputs e outputs de IA com Zod
- Sempre usar Supabase RLS para controle de acesso
- Sempre armazenar:
  1) content_json (BlockNote)
  2) content_text (plain text)
- Chunking obrigatório e consistente para embeddings
- Tool calling do agente deve respeitar permissões e RLS
- IA não deve executar ações destrutivas sem confirmação do usuário
- Import CSV deve:
  - suportar mapeamento de colunas
  - suportar preview
  - suportar upsert/reimport
  - manter rastreabilidade de origem (source/source_id)

---

## 6) Modelos de Dados (Supabase Postgres)
Crie tabelas:

### workspaces
- id uuid pk
- owner_id uuid references auth.users
- name text
- created_at timestamp

### pages
- id uuid pk
- workspace_id uuid fk workspaces.id
- parent_id uuid nullable fk pages.id
- title text
- icon text nullable
- cover_url text nullable
- content_json jsonb
- content_text text
- source text nullable (ex: 'notion')
- source_id text nullable (id original do Notion)
- created_at timestamp
- updated_at timestamp
- archived boolean default false

### projects
- id uuid pk
- workspace_id uuid fk
- title text
- description text nullable
- status text check in ('backlog','in_progress','done')
- start_date date nullable
- end_date date nullable
- source text nullable
- source_id text nullable
- created_at timestamp
- updated_at timestamp

### project_pages (pivot)
- project_id uuid fk
- page_id uuid fk
- created_at timestamp

### tasks
- id uuid pk
- workspace_id uuid fk
- project_id uuid nullable fk projects.id
- page_id uuid nullable fk pages.id
- title text
- status text check in ('todo','doing','done')
- priority int default 2
- due_date date nullable
- source text nullable
- source_id text nullable
- created_at timestamp
- updated_at timestamp

### finance_entries
- id uuid pk
- workspace_id uuid fk
- project_id uuid nullable fk projects.id
- page_id uuid nullable fk pages.id
- type text check in ('income','expense')
- category text
- amount numeric(12,2)
- date date
- note text nullable
- source text nullable
- source_id text nullable
- created_at timestamp
- updated_at timestamp

### embeddings
- id uuid pk
- workspace_id uuid fk
- page_id uuid nullable fk pages.id
- project_id uuid nullable fk projects.id
- task_id uuid nullable fk tasks.id
- finance_entry_id uuid nullable fk finance_entries.id
- chunk_text text
- embedding vector(1536)
- metadata jsonb
- source text nullable
- source_id text nullable
- created_at timestamp

Indices:
- FTS: GIN index on to_tsvector('english', pages.content_text)
- pgvector: ivfflat/hnsw index on embeddings.embedding
- indices workspace_id, page_id, project_id

### dashboard_widgets
- id uuid pk
- workspace_id uuid fk
- project_id uuid nullable fk projects.id
- title text
- widget_type text (ex: 'chart')
- chart_type text (bar/line/area/pie)
- data_source text (finance/tasks/projects/pages)
- query_config jsonb (filtros, range, agrupamento, etc.)
- layout jsonb (x,y,w,h)
- created_at timestamp
- updated_at timestamp

### import_jobs
- id uuid pk
- workspace_id uuid
- file_name text
- file_url text (storage)
- entity_type text (projects/tasks/finance/pages)
- mapping jsonb (colunas->campos)
- mode text ('insert','upsert')
- status text ('pending','processing','done','failed')
- stats jsonb (linhas importadas, atualizadas, erros)
- created_at timestamp
- updated_at timestamp

---

## 7) RLS (Row Level Security) — Obrigatório
Habilitar RLS em todas as tabelas:
- workspaces: somente owner pode ler/escrever
- pages/projects/tasks/finance/embeddings/dashboard_widgets/import_jobs:
  - somente se workspace.owner_id = auth.uid()

Sempre filtrar por workspace_id.

RAG:
- retrieval query deve estar sempre filtrada por workspace_id do usuário logado.

---

## 8) IA — Arquitetura e Endpoints (Vercel AI SDK)
Criar rotas:

### /api/ai/editor
Input:
- selectedText
- instruction
- mode: rewrite/summarize/improve/extract_tasks
Output:
- streaming text (Vercel AI SDK)
Ações:
- retornar o texto para inserir no editor
- para extract_tasks: retornar JSON (Zod schema)

### /api/ai/chat
Input:
- userMessage
- workspaceId
- optional: projectId (context específico)
Process:
1) gerar embedding do userMessage
2) buscar top-k chunks em embeddings via pgvector:
   - WHERE workspace_id = workspaceId
   - se projectId existir, priorizar chunks do projeto
   - ORDER BY embedding <-> queryEmbedding
   - LIMIT k
3) construir prompt com contexto + instruções
4) usar tool calling para executar ações no sistema
Output:
- streaming chat response + citations + tool results

### /api/ai/index
Input:
- entityType + entityId (page/project/task/finance)
Process:
1) buscar texto relevante (content_text, title, description, note)
2) chunking (~500-800 tokens ou por blocos)
3) gerar embeddings
4) upsert embeddings no supabase
Output:
- ok

IMPORTANTE:
- Use Vercel AI SDK para streaming e tool calling
- Use Zod para validar outputs de tools

---

## 9) Agente Inteligente (Tool Calling)
Implementar um "Agent Orchestrator" com:
- lista de tools disponíveis (CRUD no sistema)
- validação de permissões
- logging
- execução com segurança
- confirmação para ações destrutivas

Tools mínimas:
- create_page({workspaceId, title, parentId})
- update_page({pageId, patch})
- append_block({pageId, content})
- create_project({workspaceId, title, description, status})
- move_project_status({projectId, status})
- link_page_to_project({pageId, projectId})
- create_task({workspaceId, title, status, dueDate, priority, projectId?, pageId?})
- add_finance_entry({workspaceId, type, amount, category, date, note, projectId?, pageId?})
- query_finance_summary({workspaceId, dateRange, groupBy, projectId?})
- query_project_summary({workspaceId, projectId})
- summarize_page({pageId})
- import_csv({workspaceId, entityType, mapping, mode, fileUrl})

O agente deve sempre:
- respeitar RLS
- confirmar ações destrutivas
- citar fontes na resposta

---

## 10) Importação de CSV do Notion — Detalhes de UX
Criar páginas:
- `/import`
- `/import/jobs/:id`

Fluxo:
1) Upload do CSV
2) Detectar headers
3) Permitir mapear colunas -> campos do sistema
4) Preview das primeiras 50 linhas
5) Configurar modo:
   - INSERT: tudo novo
   - UPSERT: atualizar se já existir
6) Importar em transaction (quando possível)
7) Mostrar relatório final:
   - linhas inseridas
   - linhas atualizadas
   - linhas com erro
8) Registrar `import_jobs` e manter audit log
9) Após import, indexar embeddings das entidades importadas

---

## 11) UX tipo Excel para Financeiro
Implementar UI com:
- tabela com edição inline (cell edit)
- navegação por teclado (setas + enter)
- copiar/colar linhas (clipboard)
- validação (moeda e data)
- dropdown com:
  - categoria
  - projeto
  - tipo (income/expense)
- auto-suggest de categoria/projeto
- criação rápida de projeto/categoria inline (opcional)

Pode usar:
- TanStack Table + custom cell editors
- ou uma lib de spreadsheet leve (preferir TanStack)

---

## 12) Dashboard (shadcn charts) — Customizável
Implementar:
- tela Dashboard com grid layout (drag/drop opcional)
- CRUD de widgets
- cada widget gera uma query (server action) que retorna dados agregados:
  - finance: sum por categoria, por mês, por projeto
  - tasks: count por status, por projeto
  - projects: count por status, custo acumulado
  - pages: count por mês
- renderizar com shadcn charts (baseado em recharts)
- salvar config de widgets no DB

---

## 13) Roadmap MVP (10–14 dias)
Dia 1–2:
- Supabase setup + Auth + RLS
- workspaces + pages CRUD
Dia 3–4:
- BlockNote editor + autosave
- salvar content_json + content_text
Dia 5:
- Search textual (FTS)
Dia 6:
- Import CSV básico (finance_entries + projects)
Dia 7:
- IA Editor actions (/api/ai/editor)
Dia 8:
- embeddings + pgvector + /api/ai/index
Dia 9–10:
- Chat RAG + citations + tool calling
Dia 11:
- tasks + projects kanban
Dia 12–14:
- dashboard widgets + UX tipo excel no financeiro

---

## 14) Entregáveis (Output obrigatório)
Gere:
1) Plano de implementação em etapas
2) Schema SQL completo com:
   - tabelas
   - índices FTS e pgvector
   - RLS policies
3) Estrutura inicial do projeto Next.js com pastas e arquivos principais
4) Componentes principais:
   - Sidebar tree de páginas
   - Editor BlockNote
   - Chatbox Agent
   - Kanban de projetos
   - Financeiro (tabela tipo Excel)
   - Import CSV UI
   - Dashboard com widgets de charts
5) Endpoints de IA (editor/chat/index) usando Vercel AI SDK
6) Implementação de chunking + upsert embeddings no Supabase
7) Importer CSV:
   - upload + mapping + preview + upsert + logs
8) README com passo a passo:
   - criar projeto
   - configurar Supabase
   - configurar keys da IA
   - rodar local
   - deploy na Vercel

Agora gere a base do projeto com código inicial pronto para rodar.

# FIM DO PROMPT
