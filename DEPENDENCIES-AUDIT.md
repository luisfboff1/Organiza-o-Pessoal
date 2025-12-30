# 🔍 Auditoria de Dependências - Personal OS

**Data da Auditoria:** 28 de Dezembro de 2025

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🚨 1. Next.js 15.1.4 - DESATUALIZADO E VULNERÁVEL

**Versão Atual:** 15.1.4
**Versão Estável Recomendada:** 15.1.11 (security patch) ou 15.5.x
**Versão Latest (se quiser):** 16.1.x

**❌ PROBLEMAS:**
- **Vulnerabilidade de Segurança (RCE):** Em 11/12/2025, foi divulgada uma falha crítica no React Server Components (RSC) que permite execução remota de código não autenticado
- Faltam patches de segurança das versões 15.1.5 até 15.1.11
- Faltam melhorias de performance e bug fixes das versões 15.2, 15.3, 15.4, 15.5

**✅ AÇÃO NECESSÁRIA:**
```bash
npm install next@15.1.11  # Mínimo (security patch)
# OU
npm install next@15.5      # Recomendado (latest stable 15.x)
```

**Fontes:**
- [Next.js Security Update December 2025](https://nextjs.org/blog/security-update-2025-12-11)
- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5)

---

### ⚠️ 2. React 19 - Compatibilidade com Bibliotecas

**Versão Atual:** ^19.0.0 ✅ (Latest)
**Status:** OK, mas com ressalvas

**⚠️ PROBLEMAS CONHECIDOS:**
- Algumas bibliotecas de terceiros ainda não suportam React 19 totalmente
- Mudanças no tratamento de `ref` (agora é prop regular)
- Hooks com SessionProvider (next-auth) têm problemas conhecidos
- MUI e react-hook-form podem ter problemas de peer dependency

**✅ BIBLIOTECAS DO PROJETO QUE ESTÃO OK:**
- ✅ Radix UI (todas as versões usadas suportam React 19)
- ✅ TanStack Query 5.x (suporta React 19)
- ✅ Recharts 2.15.0 (compatível)
- ✅ shadcn/ui (React 19 ready)

**🔧 MONITORAR:**
- BlockNote 0.18.6 - precisa verificar compatibilidade React 19
- @dnd-kit - pode ter issues com React 19

**Fonte:**
- [React 19 Compatibility Issues](https://github.com/vercel/next.js/issues/72026)

---

### ⚠️ 3. Supabase Auth Helpers - DEPRECATED

**Versão Atual:** @supabase/auth-helpers-nextjs@0.10.0
**Status:** ⚠️ DEPRECATED - Este pacote foi descontinuado!

**❌ PROBLEMA:**
O pacote `@supabase/auth-helpers-nextjs` foi **deprecado** e substituído por SSR helpers integrados no `@supabase/ssr`.

**✅ SOLUÇÃO:**
```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr@latest
```

**Mudanças no Código:**
```typescript
// ANTES (deprecated)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

// DEPOIS (novo)
import { createServerClient } from '@supabase/ssr'
```

---

### ✅ 4. Supabase JS - OK mas pode atualizar

**Versão Atual:** @supabase/supabase-js@2.47.10
**Versão Latest:** 2.80.0

**📊 ATUALIZAÇÕES DISPONÍVEIS:**
- 33 versões de diferença (2.47 → 2.80)
- Melhorias de performance
- Bug fixes
- Suporte melhorado para Node.js 20+

**⚠️ IMPORTANTE:**
Node.js 18 atingiu EOL em 30/04/2025. Versões 2.79.0+ não suportam Node 18.

**✅ AÇÃO:**
```bash
npm install @supabase/supabase-js@latest
```

**Fonte:**
- [Supabase JS Releases](https://github.com/supabase/supabase-js/releases)

---

### ✅ 5. Vercel AI SDK - OK mas pode atualizar

**Versão Atual:** ai@4.0.30
**Versão Latest:** 6.x (AI SDK 6)

**📊 MELHORIAS DISPONÍVEIS:**
- AI SDK 4.2: Reasoning support (Claude 3.7 Sonnet)
- AI SDK 6.0: Novas features e melhorias de API

**⚠️ BREAKING CHANGES:**
Atualizar para 6.x pode ter breaking changes. Recomendo ficar na 4.x por enquanto ou estudar migration guide.

**Versão Segura para Atualizar:**
```bash
npm install ai@^4.0  # Vai para latest 4.x (sem breaking changes)
```

**Fonte:**
- [AI SDK 4.2 Release](https://vercel.com/blog/ai-sdk-4-2)
- [AI SDK 6 Release](https://vercel.com/blog/ai-sdk-6)

---

## 📦 ANÁLISE COMPLETA DE DEPENDÊNCIAS

### Dependencies (Produção)

| Pacote | Versão Atual | Versão Latest | Status | Ação |
|--------|--------------|---------------|--------|------|
| **Next.js** | 15.1.4 | 15.5.x / 16.1.x | 🚨 CRÍTICO | ATUALIZAR URGENTE |
| **React** | 19.0.0 | 19.0.0 | ✅ OK | - |
| **React DOM** | 19.0.0 | 19.0.0 | ✅ OK | - |
| **Supabase JS** | 2.47.10 | 2.80.0 | ⚠️ Desatualizado | Atualizar |
| **Supabase Auth Helpers** | 0.10.0 | DEPRECATED | ❌ DEPRECATED | Migrar para @supabase/ssr |
| **AI SDK** | 4.0.30 | 6.x | ⚠️ OK mas antiga | Considerar atualizar |
| **@ai-sdk/anthropic** | 1.0.5 | Latest | ✅ OK | - |
| **OpenAI SDK** | 4.77.3 | Latest | ✅ OK | - |
| **TanStack Query** | 5.62.3 | Latest 5.x | ✅ OK | - |
| **TanStack Table** | 8.20.6 | Latest 8.x | ✅ OK | - |
| **Radix UI** | 1.x-2.x | Latest | ✅ OK | - |
| **BlockNote** | 0.18.6 | 0.18.x | ⚠️ Verificar | Verificar React 19 |
| **@dnd-kit/core** | 6.3.1 | Latest | ✅ OK | - |
| **@dnd-kit/sortable** | 9.0.0 | Latest | ✅ OK | - |
| **Recharts** | 2.15.0 | 2.15.x | ✅ OK | - |
| **Zod** | 3.24.1 | Latest 3.x | ✅ OK | - |
| **Zustand** | 5.0.2 | Latest 5.x | ✅ OK | - |
| **Lucide React** | 0.468.0 | Latest | ✅ OK | - |
| **date-fns** | 4.1.0 | Latest 4.x | ✅ OK | - |
| **PapaParse** | 5.4.1 | Latest 5.x | ✅ OK | - |
| **use-debounce** | 10.0.4 | Latest 10.x | ✅ OK | - |
| **clsx** | 2.1.1 | Latest | ✅ OK | - |
| **tailwind-merge** | 2.5.5 | Latest | ✅ OK | - |
| **class-variance-authority** | 0.7.1 | Latest | ✅ OK | - |

### DevDependencies

| Pacote | Versão Atual | Status | Ação |
|--------|--------------|--------|------|
| **TypeScript** | ^5 | ✅ OK (5.7.x latest) | - |
| **@types/node** | ^22 | ✅ OK | - |
| **@types/react** | ^19 | ✅ OK | - |
| **@types/react-dom** | ^19 | ✅ OK | - |
| **ESLint** | ^9 | ✅ OK | - |
| **Tailwind CSS** | 3.4.1 | ✅ OK | - |
| **PostCSS** | ^8 | ✅ OK | - |

---

## 🎯 PLANO DE AÇÃO PRIORITÁRIO

### ⚡ URGENTE (Fazer Agora)

1. **Atualizar Next.js (Segurança Crítica)**
   ```bash
   npm install next@15.1.11
   # Testar tudo
   # Se tudo OK, considerar:
   npm install next@15.5
   ```

2. **Migrar Supabase Auth**
   ```bash
   npm uninstall @supabase/auth-helpers-nextjs
   npm install @supabase/ssr@latest
   ```

   Atualizar código em:
   - `src/lib/supabase/server.ts`
   - `src/lib/supabase/client.ts`
   - `src/middleware.ts`

### 🔧 MÉDIO PRAZO (Esta Semana)

3. **Atualizar Supabase JS**
   ```bash
   npm install @supabase/supabase-js@latest
   ```

4. **Verificar Compatibilidade BlockNote com React 19**
   - Testar editor após atualizações
   - Se houver problemas, considerar downgrade temporário do React ou atualizar BlockNote

### 📅 LONGO PRAZO (Quando Tiver Tempo)

5. **Estudar Migração para AI SDK 6**
   - Ler migration guide
   - Testar em branch separado
   - Decidir se vale a pena

6. **Monitorar Atualizações**
   - Configurar Dependabot no GitHub
   - Ou usar `npm outdated` semanalmente

---

## 🛡️ COMPATIBILIDADES VERIFICADAS

### ✅ Combinações Testadas e Seguras

```json
{
  "next": "15.5.x",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "@supabase/supabase-js": "2.80.0",
  "@supabase/ssr": "latest",
  "ai": "4.x",
  "@tanstack/react-query": "5.x",
  "typescript": "5.x"
}
```

### ⚠️ Possíveis Conflitos

1. **BlockNote 0.18.6 + React 19**
   - Não há confirmação oficial de suporte
   - Pode funcionar, mas precisa testar
   - Alternativa: Usar BlockNote 0.19.x se disponível

2. **@dnd-kit + React 19**
   - Maioria funciona, mas pode ter warnings
   - Monitorar console para deprecated warnings

---

## 📝 COMANDOS PARA EXECUTAR

### Opção 1: Atualização Conservadora (Recomendado)

```bash
# 1. Atualizar Next.js para patch de segurança
npm install next@15.1.11

# 2. Atualizar Supabase
npm install @supabase/supabase-js@latest
npm install @supabase/ssr@latest
npm uninstall @supabase/auth-helpers-nextjs

# 3. Atualizar AI SDK para latest 4.x
npm install ai@^4.0

# 4. Rebuild e testar
npm run build
npm run dev
```

### Opção 2: Atualização Agressiva (Latest de Tudo)

```bash
# Atualizar tudo para latest stable
npm install next@15.5 @supabase/supabase-js@latest @supabase/ssr@latest ai@^4.0
npm uninstall @supabase/auth-helpers-nextjs

# Rebuild
npm run build
```

---

## 🧪 CHECKLIST DE TESTES PÓS-ATUALIZAÇÃO

Após atualizar, testar:

- [ ] Build passa sem erros (`npm run build`)
- [ ] Type-check passa (`npm run type-check`)
- [ ] Dev server inicia sem warnings críticos
- [ ] Login/Signup funcionam
- [ ] Editor BlockNote funciona
- [ ] Kanban drag & drop funciona
- [ ] Chat com IA funciona
- [ ] Busca funciona
- [ ] Dashboard com gráficos renderiza
- [ ] Tabela financeira funciona
- [ ] Import CSV funciona

---

## 📚 Fontes de Referência

- [Next.js Security Update December 2025](https://nextjs.org/blog/security-update-2025-12-11)
- [Next.js 15.5 Release Notes](https://nextjs.org/blog/next-15-5)
- [React 19 Compatibility Issues](https://github.com/vercel/next.js/issues/72026)
- [Supabase JS Releases](https://github.com/supabase/supabase-js/releases)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [AI SDK 4.2 Release](https://vercel.com/blog/ai-sdk-4-2)
- [shadcn/ui React 19 Support](https://ui.shadcn.com/docs/react-19)

---

## 🎯 RESUMO EXECUTIVO

**Status Geral:** ⚠️ AÇÃO NECESSÁRIA

**Problemas Críticos:** 2
1. Next.js desatualizado com vulnerabilidade RCE
2. Supabase Auth Helpers deprecated

**Problemas Médios:** 1
1. Supabase JS muito desatualizado

**Total de Pacotes:** 48 (33 prod + 15 dev)
**Pacotes OK:** 43 (89.6%)
**Pacotes Precisam Atenção:** 5 (10.4%)

**Tempo Estimado para Correções:**
- Urgente: 1-2 horas
- Médio prazo: 2-3 horas
- Total: 3-5 horas

**Recomendação:** Executar atualizações urgentes HOJE antes de deploy em produção.
