# 🔔 Push Notifications - Guia Completo

## 📋 Visão Geral

O Compr.AI implementa **Web Push Notifications** para notificar membros quando listas compartilhadas são atualizadas.

### Tecnologias Utilizadas

- **Frontend:** Push API + Service Workers + Notifications API
- **Backend:** web-push (servidor VAPID)
- **Protocolo:** Web Push Protocol (RFC 8030)
- **Fallback:** Email via Resend

---

## 🔧 Configuração

### 1. Gerar VAPID Keys

```bash
# No diretório do projeto
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public:', keys.publicKey); console.log('Private:', keys.privateKey);"
```

Ou use o script auxiliar:

```bash
cat > generate-vapid.mjs << 'SCRIPT'
import webpush from 'web-push';
const keys = webpush.generateVAPIDKeys();
console.log('VITE_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
SCRIPT

node generate-vapid.mjs
```

### 2. Configurar Variáveis de Ambiente

#### Desenvolvimento (`.env.local`)

```env
# Frontend
VITE_VAPID_PUBLIC_KEY=sua-public-key-aqui

# Backend (para Vercel Functions locais)
VAPID_PUBLIC_KEY=mesma-public-key-acima
VAPID_PRIVATE_KEY=sua-private-key-aqui
```

#### Produção (Vercel)

```bash
vercel env add VITE_VAPID_PUBLIC_KEY
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
```

**IMPORTANTE:** As 3 variáveis devem estar configuradas:
- `VITE_VAPID_PUBLIC_KEY` (para o frontend)
- `VAPID_PUBLIC_KEY` (para o backend)
- `VAPID_PRIVATE_KEY` (para assinar as notificações)

### 3. Configurar Supabase

Execute no **Supabase SQL Editor**:

```sql
-- Adicionar coluna para push subscriptions
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_subscription 
ON user_profiles USING GIN (push_subscription);

-- Habilitar RLS (se ainda não estiver)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir usuários atualizarem suas próprias subscriptions
CREATE POLICY IF NOT EXISTS "Users can update own push subscription"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 📱 Como Funciona

### Fluxo Completo

1. **Onboarding:**
   - Usuário faz login pela primeira vez
   - Modal `PushOnboardingModal` aparece após 1 segundo
   - Usuário clica em "Permitir Notificações"

2. **Registro:**
   - Hook `usePushNotifications` solicita permissão via `Notification.requestPermission()`
   - Service Worker registra uma **PushSubscription** com a VAPID public key
   - Subscription é salva em `user_profiles.push_subscription` (JSONB)

3. **Envio:**
   - Quando um membro atualiza uma lista, chama `/api/notify-members`
   - Backend busca todos os membros da lista
   - Para cada membro com `push_subscription`:
     - Usa `web-push` para enviar notificação
     - Fallback: envia email via Resend

4. **Recebimento:**
   - Service Worker (`sw-push.js`) recebe o evento `push`
   - Exibe notificação nativa via `showNotification()`
   - Usuário clica na notificação → abre app na lista correta

### Arquitetura de Arquivos

```
src/
├── hooks/
│   └── usePushNotifications.ts          # Hook principal
├── components/notifications/
│   ├── PushNotificationsManager.tsx     # Gerenciador de onboarding
│   └── PushOnboardingModal.tsx          # Modal de primeira vez
public/
└── sw-push.js                           # Event listeners do SW
api/
└── notify-members.ts                    # Backend para envio
```

---

## 🧪 Como Testar

### Teste Local (Produção Simulada)

```bash
# 1. Build do projeto
npm run build

# 2. Preview (simula produção)
npm run preview

# 3. Abrir no navegador
# http://localhost:4173
```

### Checklist de Teste

- [ ] **Onboarding:** Modal aparece no primeiro login
- [ ] **Permissão:** Browser solicita permissão ao clicar em "Permitir"
- [ ] **Subscription:** Verificar no Supabase se `push_subscription` foi salvo
- [ ] **Envio:** Atualizar lista compartilhada e verificar se notificação chega
- [ ] **Clique:** Clicar na notificação deve abrir o app na lista correta
- [ ] **Background:** Notificação deve funcionar com app fechado
- [ ] **Unsubscribe:** Desativar notificações remove a subscription do banco

### Teste em Produção

1. Deploy no Vercel: `vercel --prod`
2. Abrir em dispositivo mobile (instalado como PWA)
3. Fazer login com 2 usuários diferentes
4. Compartilhar lista entre eles
5. Atualizar lista em um dispositivo
6. Verificar notificação no outro dispositivo

---

## 📱 Suporte de Browsers

| Browser         | Desktop | Mobile | Observações                          |
|-----------------|---------|--------|--------------------------------------|
| Chrome 80+      | ✅      | ✅     | Suporte completo                     |
| Edge 80+        | ✅      | ✅     | Suporte completo                     |
| Firefox 78+     | ✅      | ✅     | Suporte completo                     |
| Safari 16.4+    | ✅      | ⚠️     | iOS: **requer PWA instalado**        |
| Opera 67+       | ✅      | ✅     | Suporte completo                     |

**iOS/Safari:**
- Push Notifications só funcionam se o PWA estiver instalado (modo standalone)
- Não funciona no Safari normal ou aba anônima
- O código detecta automaticamente e mostra aviso

---

## 🐛 Troubleshooting

### Problema: "Push notifications não são suportadas"

**Causa:** Browser não suporta ou PWA não está instalado (iOS)

**Solução:**
```javascript
// Verificar no console do browser
console.log('ServiceWorker:', 'serviceWorker' in navigator);
console.log('PushManager:', 'PushManager' in window);
console.log('Notification:', 'Notification' in window);
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
```

### Problema: "VAPID public key não configurada"

**Causa:** Variável `VITE_VAPID_PUBLIC_KEY` não está definida

**Solução:**
```bash
# Verificar se existe
echo $VITE_VAPID_PUBLIC_KEY

# Adicionar ao .env.local
echo "VITE_VAPID_PUBLIC_KEY=sua-key-aqui" >> .env.local

# Reiniciar dev server
npm run dev
```

### Problema: Subscription não é salva no Supabase

**Causa:** Tabela `user_profiles` não tem coluna `push_subscription`

**Solução:**
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;
```

### Problema: Notificação não chega

**Diagnóstico:**
```bash
# 1. Verificar logs da API
vercel logs --follow

# 2. Verificar no console do frontend
# Abrir DevTools → Application → Service Workers
# Verificar se há erros no SW

# 3. Testar manualmente o envio
curl -X POST https://seu-app.vercel.app/api/notify-members \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "uuid-da-lista",
    "listName": "Nome da Lista",
    "currentUserId": "uuid-do-usuario"
  }'
```

### Problema: Erro 410 Gone

**Causa:** Subscription expirou ou foi revogada pelo browser

**Solução:** O código já trata automaticamente (linha 224-231 do `notify-members.ts`):
```typescript
if (error?.statusCode === 410) {
  // Remove subscription expirada do banco
  await supabase
    .from('user_profiles')
    .update({ push_subscription: null })
    .eq('user_id', userId);
}
```

---

## 🔒 Segurança

### VAPID Keys

- **NUNCA** commitar as keys no repositório
- Usar `.env.local` (ignorado pelo git)
- No Vercel, usar variáveis de ambiente criptografadas

### Validação de Dados

```typescript
// ✅ BOM - Validar origem da notificação
const { listId, listName, currentUserId } = req.body;

if (!listId || !listName || !currentUserId) {
  return res.status(400).json({ error: 'Missing required fields' });
}

// Verificar se o usuário é realmente membro da lista
const { data: member } = await supabase
  .from('list_members')
  .select('id')
  .eq('list_id', listId)
  .eq('user_id', currentUserId)
  .single();

if (!member) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

### Conteúdo das Notificações

- Não incluir dados sensíveis no corpo da notificação
- Usar apenas identificadores (listId, userId)
- Dados completos são carregados ao abrir o app

---

## 📊 Métricas e Monitoramento

### Logs Importantes

```typescript
console.log('[usePushNotifications] Subscription criada:', subscription);
console.log('[notify-members] Total unique user IDs to notify:', allUserIds.size);
console.log('[notify-members] Push subscriptions found:', pushSubscriptions.length);
console.log(`[notify-members] Push results: ${pushSuccessCount} succeeded, ${pushFailedCount} failed`);
```

### Analytics Recomendados

- **Taxa de ativação:** % de usuários que ativam notificações
- **Taxa de entrega:** % de notificações entregues com sucesso
- **Taxa de clique:** % de notificações clicadas
- **Taxa de unsubscribe:** % de usuários que desativam

---

## 🚀 Melhorias Futuras

- [ ] **Agrupamento:** Agrupar múltiplas notificações da mesma lista
- [ ] **Prioridade:** Notificações urgentes vs. normais
- [ ] **Rich Notifications:** Imagens, ações (marcar como lido)
- [ ] **Histórico:** Log de notificações enviadas/recebidas
- [ ] **Preferências:** Usuário escolher quais eventos notificar
- [ ] **Rate Limiting:** Limitar notificações por tempo (evitar spam)
- [ ] **Deep Links:** Abrir diretamente no item específico

---

## 📚 Referências

- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push - npm](https://www.npmjs.com/package/web-push)
- [Service Worker - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Última atualização:** 2025-11-17
**Versão:** 1.0.0
