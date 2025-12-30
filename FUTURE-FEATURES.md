# Futuras Features - Baseadas no Next.js SaaS Starter

> **Nota**: Este documento lista features do [Next.js SaaS Starter](https://github.com/nextjs/saas-starter) que podemos adicionar futuramente ao Personal OS.
>
> **Status atual**: Primeiro precisamos fazer o app funcionar com Supabase configurado.

---

## 📋 Features Identificadas

### 🔥 Alta Prioridade

#### 1. Activity Logging System
**O que é**: Sistema de auditoria que registra todas as ações dos usuários

**Benefícios**:
- Histórico completo de mudanças
- "Quem fez o quê quando"
- Auditoria e compliance
- Debug de problemas

**Complexidade**: Baixa
**Tempo estimado**: 2-3 horas

**Schema SQL**:
```sql
-- Enum para tipos de ação
CREATE TYPE activity_type AS ENUM (
  'sign_up',
  'sign_in',
  'sign_out',
  'update_password',
  'delete_account',
  'update_account',
  'create_team',
  'remove_team_member',
  'invite_team_member',
  'accept_invitation',
  -- Nossos tipos específicos
  'create_page',
  'update_page',
  'delete_page',
  'create_task',
  'update_task',
  'delete_task',
  'create_project',
  'update_project',
  'delete_project',
  'create_finance_entry',
  'update_finance_entry',
  'delete_finance_entry'
);

-- Tabela de logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action activity_type NOT NULL,
  entity_type TEXT, -- 'page', 'task', 'project', etc
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace activity logs"
  ON activity_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE id = workspace_id
    )
  );
```

**Helper TypeScript**:
```typescript
// src/lib/activity-logger.ts
import { createServerClient } from '@/lib/supabase/server';

type ActivityAction =
  | 'create_page'
  | 'update_page'
  | 'delete_page'
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'create_finance_entry'
  | 'update_finance_entry'
  | 'delete_finance_entry';

export async function logActivity(
  action: ActivityAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('activity_logs').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {},
    user_id: user?.id,
  });
}

// Uso nas actions
export async function createPage(data: ...) {
  const { data: page, error } = await supabase...

  if (!error) {
    await logActivity('create_page', 'page', page.id, {
      title: data.title,
      workspace_id: data.workspaceId
    });
  }

  return page;
}
```

---

#### 2. RBAC + Team Members
**O que é**: Sistema de roles (Owner, Admin, Member, Viewer) e colaboração em equipe

**Benefícios**:
- Compartilhar workspaces
- Colaboração em equipe
- Controle de acesso granular
- Convites de membros

**Complexidade**: Média
**Tempo estimado**: 1 dia

**Schema SQL**:
```sql
-- Enum para roles
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Tabela de membros
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  permissions JSONB DEFAULT '{}', -- Permissões customizadas
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),

  UNIQUE(workspace_id, user_id)
);

-- Tabela de convites
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_invitations_token ON workspace_invitations(token);

-- RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage members"
  ON workspace_members FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

**Helper TypeScript**:
```typescript
// src/lib/rbac.ts
type Role = 'owner' | 'admin' | 'member' | 'viewer';

const PERMISSIONS = {
  owner: ['*'],
  admin: ['read', 'write', 'delete', 'invite'],
  member: ['read', 'write'],
  viewer: ['read'],
};

export async function checkPermission(
  workspaceId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!member) return false;

  const rolePermissions = PERMISSIONS[member.role as Role];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
}

export async function requireRole(
  workspaceId: string,
  userId: string,
  requiredRole: Role
) {
  const supabase = await createServerClient();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!member || !hasRole(member.role, requiredRole)) {
    throw new Error('Insufficient permissions');
  }
}

function hasRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
```

---

#### 3. Local Middleware Pattern
**O que é**: Wrapper para Server Actions que garante autenticação e validação

**Benefícios**:
- Código mais limpo
- Validação centralizada
- Menos repetição
- User context garantido

**Complexidade**: Baixa
**Tempo estimado**: 2-4 horas

**Implementação**:
```typescript
// src/lib/with-auth.ts
import { createServerClient } from '@/lib/supabase/server';

type Context = {
  user: {
    id: string;
    email: string;
  };
};

export function withAuth<T extends (...args: any[]) => any>(
  handler: (data: Parameters<T>[0], context: Context) => ReturnType<T>
) {
  return async (data: Parameters<T>[0]): Promise<ReturnType<T>> => {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Unauthorized');
    }

    return handler(data, { user });
  };
}

// Uso
export const createPage = withAuth(async (data, context) => {
  // context.user está disponível e garantido
  const userId = context.user.id;

  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      ...data,
      created_by: userId,
    })
    .select()
    .single();

  return page;
});
```

**Com RBAC combinado**:
```typescript
// src/lib/with-role.ts
export function withRole<T extends (...args: any[]) => any>(
  requiredRole: Role,
  handler: (data: Parameters<T>[0], context: Context) => ReturnType<T>
) {
  return withAuth(async (data, context) => {
    await requireRole(data.workspaceId, context.user.id, requiredRole);
    return handler(data, context);
  });
}

// Uso
export const deleteWorkspace = withRole('owner', async (data, context) => {
  // Garantido que é owner
  await supabase.from('workspaces').delete().eq('id', data.workspaceId);
});
```

---

### 💰 Média Prioridade (Monetização)

#### 4. Stripe Payments & Subscriptions
**O que é**: Sistema completo de pagamentos e assinaturas

**Benefícios**:
- Monetizar o app
- Planos Free/Pro/Team
- Limitar features por plano
- Receita recorrente

**Complexidade**: Alta
**Tempo estimado**: 2-3 dias

**Estrutura**:
```
/app/pricing/page.tsx           # Página de planos
/app/api/stripe/checkout/route.ts  # Criar checkout
/app/api/stripe/webhook/route.ts   # Processar eventos
/lib/stripe.ts                      # Cliente Stripe
/lib/subscription.ts                # Helpers de assinatura
```

**Schema adicional**:
```sql
-- Adicionar ao workspaces
ALTER TABLE workspaces ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE workspaces ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE workspaces ADD COLUMN stripe_product_id TEXT;
ALTER TABLE workspaces ADD COLUMN plan_name TEXT DEFAULT 'free';
ALTER TABLE workspaces ADD COLUMN subscription_status TEXT DEFAULT 'inactive';

CREATE INDEX idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);
```

**Environment vars necessárias**:
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_FREE=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_TEAM=price_...
```

---

#### 5. Pricing Page
**O que é**: Página pública mostrando planos e preços

**Benefícios**:
- Marketing
- Conversão
- Transparência de preços

**Complexidade**: Baixa
**Tempo estimado**: 4-6 horas

**Exemplo de estrutura**:
```typescript
// app/pricing/page.tsx
const plans = [
  {
    name: 'Free',
    price: 'R$ 0',
    features: [
      '1 workspace',
      '10 páginas',
      '50 tasks',
      'Básico',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 29',
    features: [
      '5 workspaces',
      'Páginas ilimitadas',
      'Tasks ilimitadas',
      'AI Assistant',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Team',
    price: 'R$ 99',
    features: [
      'Workspaces ilimitados',
      'Tudo do Pro',
      'Colaboração em equipe',
      'RBAC avançado',
      'SSO',
    ],
  },
];
```

---

### 🎨 Baixa Prioridade (Opcional)

#### 6. Landing Page Pública
**O que é**: Página de marketing para atrair usuários

**Quando usar**: Só se for tornar SaaS público

**Features**:
- Hero section
- Features showcase
- Testimonials
- CTA para signup
- SEO otimizado

---

## 📅 Roadmap Sugerido

### Fase 1: Fazer funcionar (AGORA)
- [ ] Configurar Supabase (.env.local)
- [ ] Testar autenticação
- [ ] Validar todas features existentes
- [ ] Fix bugs

### Fase 2: Melhorias de Qualidade (Próximas semanas)
- [ ] Activity Logging
- [ ] Local Middleware Pattern (withAuth)
- [ ] Melhorar UX mobile
- [ ] Testes

### Fase 3: Colaboração (Médio prazo)
- [ ] RBAC + Team Members
- [ ] Convites de equipe
- [ ] Permissões granulares
- [ ] Workspace sharing

### Fase 4: Monetização (Longo prazo - se quiser)
- [ ] Stripe integration
- [ ] Pricing page
- [ ] Planos Free/Pro/Team
- [ ] Landing page pública

---

## 🔗 Referências

- [Next.js SaaS Starter](https://github.com/nextjs/saas-starter)
- [Drizzle Schema Original](https://github.com/nextjs/saas-starter/blob/main/lib/db/schema.ts)
- [Stripe Docs](https://stripe.com/docs)
- [Supabase RBAC](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Notas

- **Prioridade atual**: Fazer o app funcionar primeiro!
- **Não implementar agora**: Esperar app estar estável
- **Revisar periodicamente**: Ver se faz sentido adicionar features
- **Focar no MVP**: Não over-engineer desde o início

---

**Última atualização**: 2024-12-29
