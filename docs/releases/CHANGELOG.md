# 📋 Changelog - Compr.AI

Histórico de versões e mudanças do projeto.

---

## v1.8.0 - Landing Page Mobile-First (14/11/2025)

### ✨ Novidades

- **Nova Landing Page** com design mobile-first
  - Aparência de app nativo (não PWA)
  - Animações suaves com Framer Motion
  - 4 feature cards principais com gradientes
  - Seção "How it Works" em 4 passos
  - Grid de benefícios (8 cards)
  - Social proof com badge Gemini AI
  - CTAs estratégicos (hero + final)

### 🎨 Design

- Border radius iOS-like (`rounded-[24px]`)
- Gradientes personalizados por feature
- Background blobs animados
- Touch feedback em botões (`active:scale-[0.98]`)
- Tipografia hierárquica (font-black + font-bold)

### 📊 Métricas

- 480 linhas de código
- 60fps em animações
- < 2s time to interactive
- WCAG AA compliant

### 📁 Arquivos Modificados

- `src/pages/Landing.tsx` - Reescrito completamente
- `docs/features/08-interface.md` - Documentação criada

---

## v1.7.0 - Autenticação Obrigatória (13/11/2025)

### 🔐 Mudanças Principais

- **Removida autenticação anônima**
- `deviceId` agora sempre = `user.id` do Supabase
- Auth obrigatória via email/senha
- Dados centralizados na nuvem

### ⚙️ Implementação

- `AuthContext` com Supabase Auth
- `ProtectedRoute` component
- Migration SQL para remover tabela `devices`
- RLS policies atualizadas

### 📁 Arquivos

- `src/contexts/AuthContext.tsx` - Criado
- `src/components/auth/ProtectedRoute.tsx` - Criado
- `supabase/migrations/006_simplify_auth.sql` - Criado

### 🔄 Breaking Changes

- ⚠️ Requer login online na primeira vez
- ⚠️ Dados anônimos antigos inacessíveis

---

## v1.6.0 - Base-N Conversion (Planejado)

### 🎯 Objetivo

Adicionar conversão de bases numéricas para manipulação de códigos de compartilhamento.

### 📦 Features Planejadas

- Conversão Base-10 ↔ Base-36
- Geração de códigos curtos
- Validação de códigos

---

## v1.5.0 - Sugestões com IA (Novembro/2025)

### 🧠 Novidades

- **Integração com Google Gemini AI**
- Sugestões personalizadas baseadas em histórico
- API endpoint `/api/suggest-items`
- Modal de criação com IA no frontend

### 🚀 Implementação

- Vercel Function para processamento
- Hook `useSuggestions`
- Prompt engineering otimizado
- Cache de 5 minutos
- Rate limiting (10 req/min)

### 📊 Performance

- ~1-2s de latência
- 700 tokens/requisição
- 1.400 sugestões/mês (free tier)

### 📁 Arquivos

- `api/suggest-items.ts` - Criado
- `src/hooks/useSuggestions.ts` - Criado
- `src/components/lists/CreateListModal.tsx` - Atualizado

---

## v1.4.0 - OCR de Notas Fiscais (Novembro/2025)

### 📸 Novidades

- **Escaneamento de notas fiscais**
- OCR local com Tesseract.js
- Fallback para Cloud Vision
- Estruturação com Gemini AI
- Preview editável antes de salvar

### ⚙️ Implementação

- `useOCR` hook
- `Scanner` component
- `ReceiptPreview` component
- Compressão de imagens (< 5MB)

### 📁 Arquivos

- `src/hooks/useOCR.ts` - Criado
- `src/components/scanner/Scanner.tsx` - Criado
- `src/components/scanner/ReceiptPreview.tsx` - Criado

---

## v1.3.0 - Histórico de Compras (Novembro/2025)

### 📜 Novidades

- **Página de histórico** (`/history`)
- Agrupamento por data
- Cards com gradientes
- Filtro por categoria
- Exportação (planejado)

### 📊 Features

- Visualização de itens comprados
- Registro automático ao marcar item
- Análise de frequência (planejado)

### 📁 Arquivos

- `src/pages/History.tsx` - Criado
- `supabase/migrations/003_history.sql` - Criado

---

## v1.2.0 - Compartilhamento Real-time (Novembro/2025)

### 👥 Novidades

- **Sistema de compartilhamento**
- Códigos únicos de 6 caracteres
- Sincronização em tempo real (Supabase Realtime)
- Gestão de membros
- Link de convite

### ⚙️ Implementação

- `useRealtimeSync` hook
- Modal de compartilhamento
- Página de join (`/join/:code`)

### 📁 Arquivos

- `src/hooks/useRealtimeSync.ts` - Criado
- `src/components/lists/ShareListModal.tsx` - Criado
- `src/pages/JoinList.tsx` - Criado
- `supabase/migrations/002_sharing.sql` - Criado

---

## v1.1.0 - Análise de Preços (Novembro/2025)

### 💰 Novidades

- **Histórico de preços**
- Comparação ao longo do tempo
- Gráficos (planejado)
- Alertas de variação (planejado)

### 📁 Arquivos

- `supabase/migrations/004_price_history.sql` - Criado

---

## v1.0.0 - MVP (Outubro/2025)

### 🎉 Release Inicial

- CRUD de listas de compras
- CRUD de itens
- Armazenamento local (IndexedDB/Dexie)
- Sincronização com Supabase
- PWA básico
- Modo offline

### 📦 Funcionalidades

- Criar/editar/excluir listas
- Adicionar/remover itens
- Marcar itens como comprados
- Sincronização manual
- Persistência offline

### 🏗️ Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Supabase (PostgreSQL)
- Dexie.js (IndexedDB)
- vite-plugin-pwa

### 📁 Arquivos Principais

- `src/pages/Home.tsx`
- `src/pages/ListDetail.tsx`
- `src/hooks/useLocalLists.ts`
- `src/hooks/useLocalItems.ts`
- `src/hooks/useSync.ts`
- `src/lib/db.ts`
- `supabase/migrations/001_initial_schema.sql`

---

## Próximas Versões (Planejado)

### v2.0.0 - Chat com IA
- Chat contextual sobre listas
- Dicas de economia
- Previsão de gastos

### v2.1.0 - Notificações
- Push notifications
- Lembretes de compras
- Alertas de preço

### v2.2.0 - Analytics
- Dashboard de estatísticas
- Gastos por categoria
- Tendências de consumo

---

**Última atualização:** 14/11/2025
**Versão Atual:** v1.8.0
