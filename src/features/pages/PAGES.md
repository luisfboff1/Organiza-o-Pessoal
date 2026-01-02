# Sistema de Pages - Documentação

Sistema completo de páginas estilo Notion com hierarquia, links, templates, versionamento e mais.

## 📁 Como Funciona a Hierarquia de Pastas

### Criar uma Nova Página

1. **Página raiz** (sem pasta):
   - Clique no botão "Nova Página" no sidebar
   - A página aparece na raiz da árvore

2. **Página dentro de outra** (subpágina/pasta):
   - Abra a página pai
   - Clique em "Nova Página" dentro dela
   - Ou arraste uma página para dentro de outra na árvore

### Organizar em Pastas

As páginas funcionam como pastas - qualquer página pode conter outras páginas:

```
📄 Projetos (página pai)
  ├─ 📄 Projeto A (subpágina)
  │   ├─ 📄 Tarefas (sub-subpágina)
  │   └─ 📄 Documentação
  ├─ 📄 Projeto B
  └─ 📄 Projeto C

📄 Finanças (página pai)
  ├─ 📄 2024
  │   ├─ 📄 Janeiro
  │   └─ 📄 Fevereiro
  └─ 📄 2025
```

### Mover Páginas (Drag & Drop)

- **Arrastar para dentro**: Solte sobre outra página para criar subpágina
- **Arrastar para fora**: Arraste para a esquerda para tornar página raiz
- **Reordenar**: Arraste para cima/baixo para mudar a ordem

## 🔗 Como Referenciar Páginas

### Link Inline Entre Páginas

Use a sintaxe `[[Nome da Página]]` no editor:

```
Veja mais detalhes em [[Documentação do Projeto]]

Relacionado: [[Tarefas]] e [[Cronograma]]
```

Ao digitar `[[`, um menu de autocompletar aparece com todas as páginas disponíveis.

### Como Funciona

1. Digite `[[` no editor
2. Digite o nome da página (busca em tempo real)
3. Selecione a página desejada
4. Um link clicável é inserido com:
   - 🔵 Fundo azul claro
   - 📄 Ícone da página (ou emoji se tiver)
   - Título da página atualizado em tempo real

### Backlinks Automáticos

Quando você referencia uma página:
- A página referenciada mostra automaticamente quem a está referenciando
- Navegação bidirecional: da página A → B e de B → A

**Exemplo:**
```
Página "Projeto A":
  Conteúdo: "Veja os requisitos em [[Documentação]]"

Página "Documentação":
  Mostra: "📎 Backlinks: Projeto A"
```

## 📋 Templates (Modelos)

### Criar um Template

1. Crie e configure uma página como modelo
2. Clique no menu ⋯ → "Salvar como Template"
3. Dê um nome e descrição ao template

### Usar um Template

1. Clique em "Nova Página"
2. Clique em "📋 Templates"
3. Selecione o template desejado
4. Uma nova página é criada com todo o conteúdo do template

**Templates Úteis:**
- 📝 Reunião semanal (com seções: pauta, ações, decisões)
- 📊 Relatório mensal (com estrutura de dados)
- 🎯 Planejamento de projeto (com checklist)
- 📖 Documentação técnica (com seções padrão)

## 🎨 Personalização Visual

### Ícone da Página

1. Clique no ícone 📄 ou "Adicionar ícone"
2. Escolha um emoji da galeria (120+ opções)
3. O ícone aparece:
   - No título da página
   - Na árvore de navegação
   - Nos links para esta página

**Categorias de ícones:**
- 📄 Documentos
- 💼 Trabalho
- 🎯 Metas e objetivos
- 📊 Dados e gráficos
- 🎨 Design e criatividade
- 🔧 Ferramentas e utilitários
- 🌍 Geografia e viagem
- 🎓 Educação
- 🏃 Esporte e atividades
- 😊 Emoções e pessoas

### Capa da Página

1. Clique em "Adicionar capa"
2. Escolha entre:
   - **Presets**: 12 imagens do Unsplash prontas
   - **Upload**: Envie sua própria imagem

A capa aparece no topo da página.

## 🔄 Versionamento Automático

Toda alteração no conteúdo cria uma versão automaticamente.

### Visualizar Histórico

1. Clique no menu ⋯ → "Histórico de Versões"
2. Veja todas as versões anteriores com:
   - ⏰ Data e hora da alteração
   - 👤 Quem fez a alteração
   - 📝 Resumo das mudanças

### Comparar Versões

1. Selecione uma versão antiga
2. Veja as diferenças:
   - 🟢 Verde: Conteúdo adicionado
   - 🔴 Vermelho: Conteúdo removido
   - Comparação lado a lado

### Restaurar Versão Antiga

1. Abra o histórico de versões
2. Clique em "Restaurar" na versão desejada
3. ⚠️ A versão atual é salva antes de restaurar

**Casos de uso:**
- Desfazer alterações acidentais
- Recuperar conteúdo deletado
- Comparar diferentes versões de um documento
- Auditoria de mudanças

## 📤 Exportar Páginas

### Exportar para Markdown

1. Clique no menu ⋯ → "Exportar"
2. Escolha "Markdown (.md)"
3. Arquivo baixado com:
   - Todo o conteúdo formatado
   - Títulos, listas, código preservados
   - Tabelas convertidas
   - Links convertidos para markdown

### Exportar para PDF

1. Clique no menu ⋯ → "Exportar"
2. Escolha "PDF (.pdf)"
3. Arquivo gerado com:
   - Formatação profissional
   - Metadados (título, datas)
   - Cabeçalho e rodapé
   - Numeração de páginas
   - Quebras de página automáticas

**Incluído no PDF:**
- ✅ Título e ícone
- ✅ Data de criação e atualização
- ✅ Títulos hierárquicos (h1, h2, h3)
- ✅ Listas (bullet, numerada, checklist)
- ✅ Código com formatação
- ✅ Citações
- ✅ Tabelas
- ✅ Blocos de spreadsheet
- ✅ Links para outras páginas

## 📥 Importar do Notion

### Importar ZIP do Notion

1. No Notion: Settings → Export → Export All → Markdown & CSV
2. Baixe o arquivo ZIP
3. No sistema: vá para "Importar" → "Notion ZIP"
4. Faça upload do arquivo ZIP
5. Aguarde o processamento

**O que é importado:**
- ✅ Todas as páginas com hierarquia preservada
- ✅ Títulos e ícones
- ✅ Formatação (negrito, itálico, código)
- ✅ Listas e checklists
- ✅ Tabelas
- ✅ Códigos
- ✅ Links entre páginas (convertidos para [[links]])
- ✅ Estrutura de pastas/subpáginas

**Processo:**
1. Extração do ZIP
2. Análise da estrutura de pastas
3. Primeira passada: criar todas as páginas
4. Segunda passada: resolver links internos
5. Criação da hierarquia

## 🗂️ Outras Funcionalidades

### Duplicar Página

1. Clique no menu ⋯ → "Duplicar"
2. Uma cópia é criada com:
   - " (Cópia)" no título
   - Todo o conteúdo duplicado
   - Subpáginas também duplicadas (recursivo)
   - Novo ID único

### Arquivar Página

1. Clique no menu ⋯ → "Arquivar"
2. A página é ocultada mas não deletada
3. Pode ser restaurada depois

### Restaurar Página Arquivada

1. Acesse a lista de páginas arquivadas
2. Clique em "Restaurar"
3. A página volta para a árvore

### Deletar Permanentemente

1. Clique no menu ⋯ → "Deletar"
2. ⚠️ **Ação irreversível** - confirme antes
3. A página e todas as subpáginas são deletadas

## ⌨️ Atalhos do Editor

### Formatação Básica

- `**texto**` → **Negrito**
- `*texto*` → *Itálico*
- `` `código` `` → `código inline`
- `~~texto~~` → ~~Tachado~~

### Blocos

- `#` + espaço → Título 1
- `##` + espaço → Título 2
- `###` + espaço → Título 3
- `-` + espaço → Lista bullet
- `1.` + espaço → Lista numerada
- `[]` + espaço → Checklist
- ` ``` ` → Bloco de código
- `>` + espaço → Citação

### Links e Referências

- `[[` → Menu de páginas (autocompletar)
- `[[Nome]]` → Link para página
- `[texto](url)` → Link externo

### Blocos Especiais

- `/spreadsheet` → Inserir planilha
- `/table` → Inserir tabela
- `/code` → Inserir código

## 🔍 Busca e Navegação

### Breadcrumbs (Caminho)

No topo de cada página, veja o caminho completo:
```
Projetos > Projeto A > Documentação
```

Clique em qualquer parte para navegar.

### Árvore de Navegação

- 📂 Expandir/recolher páginas com filhos
- ➕ Botão para criar subpágina rápido
- 🔍 Busca em tempo real na árvore
- 📌 Páginas favoritas (se implementado)

### Backlinks Panel

Cada página mostra:
- Quantas páginas a referenciam
- Lista de páginas que contêm links para ela
- Clique para navegar

## 💡 Casos de Uso

### 1. Gestão de Projetos
```
📊 Projetos
  ├─ 🎯 Projeto Alpha
  │   ├─ 📋 Requisitos
  │   ├─ ✅ Tarefas
  │   ├─ 📅 Cronograma
  │   └─ 📝 Atas de Reunião
  │       ├─ Reunião 2024-01-15
  │       └─ Reunião 2024-01-22
  └─ 🚀 Projeto Beta
```

### 2. Base de Conhecimento
```
📚 Documentação
  ├─ 🔧 Tutoriais
  │   ├─ Como começar
  │   ├─ Guia avançado
  │   └─ FAQ
  ├─ 📖 Referência
  │   ├─ API
  │   └─ Arquitetura
  └─ 🐛 Troubleshooting
```

### 3. Notas Pessoais
```
📝 Notas
  ├─ 💭 Ideias
  ├─ 📚 Estudos
  │   ├─ TypeScript
  │   ├─ Next.js
  │   └─ Supabase
  ├─ ✍️ Diário
  └─ 🎯 Metas 2024
```

### 4. Processos e SOPs
```
⚙️ Processos
  ├─ 📋 Onboarding
  ├─ 🔄 Deploy
  ├─ 🐛 Bug Fix Workflow
  └─ 📊 Relatórios Mensais (Template)
```

## 🛠️ Recursos Técnicos

### Editor Rico (BlockNote)

- Editor WYSIWYG moderno
- Blocos drag & drop
- Formatação em tempo real
- Suporte a markdown
- Undo/Redo ilimitado
- Colaboração pronta (se habilitado)

### Armazenamento

- **Supabase PostgreSQL**: Dados estruturados
- **JSON**: Conteúdo do editor
- **Storage**: Imagens de capa
- **Real-time**: Atualizações ao vivo

### Performance

- Server-side rendering (SSR)
- Otimização de queries
- Cache de páginas
- Lazy loading de subpáginas
- Debounce em buscas

### Segurança

- Autenticação obrigatória
- Row Level Security (RLS)
- Isolamento por workspace
- Validação de permissões
- Sanitização de uploads

## 📊 Estrutura de Dados

### Tabela: pages

```sql
- id: UUID
- workspace_id: UUID (FK)
- title: string
- icon: string (emoji)
- cover: string (URL)
- content_json: JSONB (BlockNote)
- content_text: text (busca)
- parent_id: UUID (self-reference)
- position: integer (ordem)
- archived_at: timestamp
- created_at: timestamp
- updated_at: timestamp
- created_by: UUID (FK)
```

### Tabela: page_versions

```sql
- id: UUID
- page_id: UUID (FK)
- content_json: JSONB
- content_text: text
- created_at: timestamp
- created_by: UUID (FK)
- change_summary: text
```

### Tabela: page_templates

```sql
- id: UUID
- workspace_id: UUID (FK)
- template_id: UUID (page source)
- name: string
- description: text
- category: string
- created_at: timestamp
```

## 🚀 Próximos Recursos (Possíveis)

- [ ] Compartilhamento público de páginas
- [ ] Colaboração em tempo real
- [ ] Comentários em páginas
- [ ] Menções (@usuário)
- [ ] Permissões granulares
- [ ] Anexos e arquivos
- [ ] Integração com calendário
- [ ] Widgets e embeds
- [ ] Dark mode por página
- [ ] Atalhos customizáveis

---

## 🆘 Suporte

### Problemas Comuns

**Página não carrega:**
- Verifique conexão com internet
- Recarregue a página (F5)
- Limpe cache do navegador

**Links quebrados:**
- Verifique se a página referenciada existe
- Referencie novamente com [[

**Erro ao exportar:**
- Verifique tamanho do conteúdo
- Tente formato alternativo (MD vs PDF)

**Versão não restaura:**
- Verifique permissões
- Tente restaurar versão mais recente primeiro

### Atalhos Úteis

- `Ctrl/Cmd + S`: Salvar (auto-save está ativo)
- `Ctrl/Cmd + Z`: Desfazer
- `Ctrl/Cmd + Shift + Z`: Refazer
- `Ctrl/Cmd + K`: Buscar páginas (se implementado)
- `/`: Menu de comandos no editor

---

**Versão:** 1.0.0
**Última atualização:** Janeiro 2025
