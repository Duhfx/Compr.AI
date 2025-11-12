# 🤝 Release 2 — Compartilhamento e Sincronização em Tempo Real

## 📅 Data de Implementação
2025-11-12

## 🎯 Objetivo
Implementar sistema completo de compartilhamento de listas com sincronização em tempo real entre dispositivos usando Supabase Realtime.

---

## ✅ Features Implementadas

### 1. Sistema de Compartilhamento

#### 📋 Migration SQL (`supabase/migrations/002_sharing.sql`)
- **Tabela `shared_lists`**: Armazena códigos de compartilhamento
  - Códigos únicos de 6 caracteres (ex: ABC123)
  - Permissões: `edit` ou `readonly`
  - Expiração opcional
  - RLS (Row Level Security) configurado

- **Tabela `list_members`**: Rastreia membros de listas compartilhadas
  - Unique constraint (list_id, device_id)
  - Timestamps de entrada e última visualização
  - Status ativo/inativo
  - Índices para performance

#### 🗄️ Schema Local (Dexie)
- Atualizado `src/lib/db.ts` com:
  - Interface `SharedList`
  - Interface `ListMember`
  - Versão 2 do schema IndexedDB
  - Sincronização local das informações de compartilhamento

#### 🔧 Utilitários de Compartilhamento (`src/lib/sharing.ts`)
Funções implementadas:
- `generateShareCode()`: Gera código único de 6 caracteres
- `createShareLink()`: Cria link de compartilhamento com validação de unicidade
- `validateShareCode()`: Valida código e retorna informações da lista
- `joinSharedList()`: Adiciona dispositivo como membro da lista
- `leaveSharedList()`: Remove membro (soft delete)
- `getListMembers()`: Busca membros ativos de uma lista
- `updateLastSeen()`: Atualiza timestamp de última visualização
- `isSharedList()`: Verifica se lista é compartilhada
- `getShareInfo()`: Busca informações de compartilhamento
- `revokeShareLink()`: Revoga link de compartilhamento

### 2. Sincronização em Tempo Real

#### 🔄 Hook useRealtimeSync (`src/hooks/useRealtimeSync.ts`)
- Subscrição a mudanças em `shopping_items` via Supabase Realtime
- Eventos suportados: INSERT, UPDATE, DELETE
- Atualização automática do IndexedDB local
- Callbacks opcionais para cada tipo de evento
- Gerenciamento de lifecycle (subscribe/unsubscribe)
- Hook adicional `useRealtimeListSync` para metadados da lista

#### 🔄 Hook useSync Atualizado (`src/hooks/useSync.ts`)
- Upload de listas locais para Supabase
- Download de listas (próprias + compartilhadas)
- Sincronização bidirecional de itens
- Resolução de conflitos (Last-Write-Wins baseado em updated_at)
- Tratamento de erros robusto
- Retorna estatísticas de sincronização

### 3. Componentes de UI

#### 📤 ShareListModal (`src/components/lists/ShareListModal.tsx`)
- Formulário de criação de link de compartilhamento
- Seleção de permissão (edit/readonly)
- Opção de expiração (1, 7, 30 dias ou nunca)
- Exibição de código e URL gerados
- Botão de copiar para área de transferência
- Feedback visual (ícone de check ao copiar)
- Opção de revogar link

#### 📥 JoinListModal (`src/components/lists/JoinListModal.tsx`)
- Input de código com validação em tempo real
- Formatação automática (uppercase, máximo 6 caracteres)
- Validação assíncrona ao digitar
- Exibição de informações da lista após validação
- Feedback visual de sucesso/erro
- Estados de loading/validating

#### 🏷️ SharedListBadge (`src/components/lists/SharedListBadge.tsx`)
- Badge visual "Compartilhada" com ícone
- Contador de membros
- Indicador de permissão (edit/readonly)
- Cores diferentes por tipo de permissão
- Tamanhos: small e medium

#### 👥 MemberAvatars (`src/components/lists/MemberAvatars.tsx`)
- Avatares circulares dos membros
- Iniciais do nickname
- Cores consistentes por dispositivo (hash do deviceId)
- Tooltip com nome e status online/offline
- Indicador "+N" para membros ocultos
- Limite configurável de avatares visíveis

#### 🌐 Página JoinList (`src/pages/JoinList.tsx`)
- Rota `/join/:code` para compartilhamento direto via URL
- Validação automática do código ao carregar
- Tela de sucesso com informações da lista
- Tela de erro com opções de retry
- Estados de loading
- Criação automática de deviceId se não existir
- Redirecionamento automático após entrar

### 4. Types e Interfaces

#### 📝 Database Types (`src/types/database.ts`)
- Types completos para todas as tabelas do Supabase
- Interfaces Row, Insert e Update para cada tabela
- Type-safe queries com TypeScript
- Inclui tabelas de:
  - devices
  - shopping_lists
  - shopping_items
  - shared_lists
  - list_members
  - purchase_history
  - price_history

---

## 🔧 Como Usar

### 1. Aplicar Migration no Supabase

```bash
# Via Supabase CLI
supabase db push

# Ou executar SQL manualmente no Dashboard
# Copiar conteúdo de supabase/migrations/002_sharing.sql
```

### 2. Atualizar Variáveis de Ambiente

Certifique-se que `.env.local` contém:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

Para Vercel Functions (backend):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
```

### 3. Integrar Componentes

#### Em ListDetail.tsx (página de detalhe da lista):

```tsx
import { useState } from 'react';
import { ShareListModal } from '../components/lists/ShareListModal';
import { SharedListBadge } from '../components/lists/SharedListBadge';
import { MemberAvatars } from '../components/lists/MemberAvatars';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export const ListDetail = () => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const listId = /* ... */;
  const deviceId = /* ... */;

  // Ativar sincronização em tempo real
  useRealtimeSync({
    listId,
    enabled: true,
    onItemAdded: (item) => {
      console.log('Item added:', item);
      // Recarregar itens ou usar state management
    },
    onItemUpdated: (item) => {
      console.log('Item updated:', item);
    },
    onItemDeleted: (itemId) => {
      console.log('Item deleted:', itemId);
    }
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1>{list.name}</h1>
        <SharedListBadge memberCount={3} permission="edit" />
        <MemberAvatars listId={listId} maxVisible={3} />
      </div>

      <button onClick={() => setShareModalOpen(true)}>
        Compartilhar Lista
      </button>

      <ShareListModal
        listId={listId}
        listName={list.name}
        deviceId={deviceId}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
```

#### Em Home.tsx (página inicial):

```tsx
import { useState } from 'react';
import { JoinListModal } from '../components/lists/JoinListModal';

export const Home = () => {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const deviceId = /* ... */;

  const handleJoinSuccess = (listId: string) => {
    console.log('Joined list:', listId);
    // Navegar para a lista ou recarregar
    navigate(`/list/${listId}`);
  };

  return (
    <div>
      <button onClick={() => setJoinModalOpen(true)}>
        Entrar em Lista Compartilhada
      </button>

      <JoinListModal
        deviceId={deviceId}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};
```

#### Adicionar rota em App.tsx:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JoinList } from './pages/JoinList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list/:id" element={<ListDetail />} />
        <Route path="/join/:code" element={<JoinList />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4. Sincronização Manual

```tsx
import { useSync } from '../hooks/useSync';

const MyComponent = () => {
  const { sync, syncing, lastSyncAt, error } = useSync();
  const deviceId = /* ... */;

  const handleSync = async () => {
    const result = await sync(deviceId);

    if (result.success) {
      console.log('Sync complete:', {
        listsUploaded: result.listsUploaded,
        listsDownloaded: result.listsDownloaded,
        itemsUploaded: result.itemsUploaded,
        itemsDownloaded: result.itemsDownloaded
      });
    } else {
      console.error('Sync error:', result.error);
    }
  };

  return (
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Sincronizando...' : 'Sincronizar'}
    </button>
  );
};
```

---

## 🔒 Segurança

### Row Level Security (RLS)
Todas as tabelas de compartilhamento têm RLS habilitado com políticas permissivas. Para produção, considere:

```sql
-- Exemplo: Permitir apenas owner modificar shared_lists
CREATE POLICY "Owner can manage share links"
  ON shared_lists FOR ALL
  USING (owner_device_id = auth.uid())
  WITH CHECK (owner_device_id = auth.uid());

-- Permitir membros visualizar informações
CREATE POLICY "Members can view list"
  ON shopping_items FOR SELECT
  USING (
    list_id IN (
      SELECT list_id FROM list_members
      WHERE device_id = auth.uid() AND is_active = true
    )
  );
```

### Validações
- Códigos de compartilhamento são validados no servidor
- Permissões são verificadas antes de permitir edições
- Links podem expirar automaticamente
- Membros inativos não têm acesso

---

## 🐛 Debugging

### Verificar Realtime Connection

```tsx
const { isConnected } = useRealtimeSync({ listId, enabled: true });

console.log('Realtime connected:', isConnected);
```

### Logs do Supabase Realtime

```tsx
// O hook useRealtimeSync já inclui logs:
// [Realtime] Subscribed to list:${listId}
// [Realtime] Error subscribing to list:${listId}
```

### Verificar Sincronização

```tsx
const { sync } = useSync();

const result = await sync(deviceId);
console.log('Sync result:', result);
```

---

## 📊 Performance

### Otimizações Implementadas
- **Índices**: Criados em share_code, list_id, device_id
- **Unique Constraints**: Evitam duplicatas em list_members
- **Soft Deletes**: is_active ao invés de DELETE para preservar histórico
- **Debouncing**: Validação de código apenas com 6 caracteres
- **Last-Write-Wins**: Resolução simples de conflitos

### Limites do Supabase (Free Tier)
- **Realtime**: 500 concurrent connections
- **Database**: 500MB
- **Bandwidth**: 5GB/mês

---

## ✅ Checklist de Testes

### Compartilhamento
- [ ] Criar link de compartilhamento
- [ ] Copiar código/URL para área de transferência
- [ ] Validar código existente
- [ ] Validar código inválido/expirado
- [ ] Entrar em lista com código válido
- [ ] Entrar via URL direta (/join/:code)
- [ ] Verificar permissões edit/readonly
- [ ] Revogar link de compartilhamento

### Sincronização em Tempo Real
- [ ] Adicionar item em dispositivo A, aparecer em B
- [ ] Editar item em dispositivo A, atualizar em B
- [ ] Deletar item em dispositivo A, remover em B
- [ ] Marcar item como comprado, sincronizar
- [ ] Editar nome da lista, sincronizar
- [ ] Testar com múltiplos membros (3+)

### Offline/Online
- [ ] Criar itens offline
- [ ] Sincronizar ao voltar online
- [ ] Conflitos são resolvidos corretamente
- [ ] Indicador de status de conexão

### UI/UX
- [ ] Badge "Compartilhada" aparece corretamente
- [ ] Avatares dos membros são exibidos
- [ ] Modais abrem e fecham corretamente
- [ ] Feedback visual ao copiar código
- [ ] Estados de loading/error são claros
- [ ] Responsividade mobile

---

## 🚀 Próximos Passos (Release 3)

A Release 3 focará em **Inteligência de Sugestões**:

1. Histórico de compras automático
2. Sugestões via Gemini AI
3. Autocompletar inteligente
4. Interpretação de texto livre
5. Padronização de nomes de produtos

Consulte `ROADMAP_DETALHADO.md` para detalhes.

---

## 📝 Notas Importantes

### Atualização do Dexie Schema
A versão do schema IndexedDB foi incrementada de 1 para 2. O Dexie gerencia migrations automaticamente, mas dados existentes serão preservados.

### Device ID
O sistema usa `deviceId` como identificador único. Certifique-se de:
- Gerar UUID na primeira execução
- Salvar em IndexedDB (userDevice)
- Usar consistentemente em todas as operações

### Supabase Service Key
Para as Vercel Functions, use `SUPABASE_SERVICE_KEY` (não anon key) para:
- Bypass de RLS quando necessário
- Operações administrativas
- Acesso total ao banco

⚠️ **NUNCA** exponha a service key no frontend!

---

**Desenvolvido por Claude Code**
**Data:** 2025-11-12
**Versão:** 2.0.0
