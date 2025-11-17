# 🔧 Solução: AbortError - Push Service Error

## 🐛 Problema Identificado

```
AbortError: Registration failed - push service error
```

### Causa Raiz

O arquivo `.env.local` não existia, então a variável `VITE_VAPID_PUBLIC_KEY` estava `undefined`. Quando o código tentava registrar a Push Subscription sem uma VAPID key válida, o browser retornava o erro genérico "push service error".

---

## ✅ Solução Aplicada

### 1. Geradas VAPID Keys

```bash
npx -y web-push generate-vapid-keys
```

**Resultado:**
```
Public Key:  BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8
Private Key: n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE
```

### 2. Criado arquivo `.env.local`

```env
# Frontend (Vite)
VITE_VAPID_PUBLIC_KEY=BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Backend (Vercel Functions)
VAPID_PUBLIC_KEY=BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8
VAPID_PRIVATE_KEY=n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
GEMINI_API_KEY=sua-gemini-api-key-aqui
RESEND_API_KEY=sua-resend-api-key-aqui
```

### 3. Melhorado Tratamento de Erros

**Em `src/hooks/usePushNotifications.ts`:**

```typescript
// Validação mais clara
console.log('[usePushNotifications] VAPID public key presente:', !!vapidPublicKey);

if (!vapidPublicKey) {
  throw new Error('VAPID public key não configurada. Verifique se VITE_VAPID_PUBLIC_KEY está no .env.local');
}

// Mensagens de erro específicas
if (err.name === 'AbortError') {
  errorMessage = 'Falha ao registrar push. Verifique se a VAPID key está configurada corretamente.';
} else if (err.name === 'NotAllowedError') {
  errorMessage = 'Permissão negada. Habilite notificações nas configurações do navegador.';
}
```

---

## 🧪 Como Testar Agora

### Passo 1: Configurar Supabase (se ainda não fez)

```sql
-- No Supabase SQL Editor
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

CREATE INDEX IF NOT EXISTS idx_user_profiles_push_subscription 
ON user_profiles USING GIN (push_subscription);
```

### Passo 2: Atualizar .env.local com suas credenciais

Substitua `sua-anon-key-aqui`, `sua-service-role-key-aqui`, etc. pelas suas credenciais reais do Supabase/Gemini/Resend.

### Passo 3: Build e Preview

```bash
# Build
npm run build

# Preview (simula produção)
npm run preview
```

### Passo 4: Testar no Navegador

1. Abra `http://localhost:4173`
2. Faça login
3. Modal de Push Notifications deve aparecer
4. Clique em "Permitir Notificações"
5. **Agora deve funcionar!** ✅

### Passo 5: Verificar Logs

Abra o Console do navegador (F12) e veja:

```
[usePushNotifications] VAPID public key presente: true
[usePushNotifications] Service Worker registrado, criando subscription...
[usePushNotifications] Subscription criada com sucesso: {...}
[usePushNotifications] Subscription salva no Supabase
```

---

## 🚀 Configurar no Vercel (Produção)

```bash
# Adicionar variáveis de ambiente no Vercel
vercel env add VITE_VAPID_PUBLIC_KEY
# Cole: BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8

vercel env add VAPID_PUBLIC_KEY
# Cole: BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8

vercel env add VAPID_PRIVATE_KEY
# Cole: n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE

# Deploy
vercel --prod
```

---

## 📚 Outros Erros Comuns

### "NotAllowedError: Permission denied"

**Causa:** Usuário negou a permissão ou bloqueou notificações

**Solução:**
1. Chrome: `chrome://settings/content/notifications`
2. Permitir notificações para o site
3. Recarregar página e tentar novamente

### "NotSupportedError: Push messaging is not supported"

**Causa:** Browser não suporta Push API ou PWA não está instalado (iOS)

**Solução:**
- Desktop: Usar Chrome, Firefox ou Edge
- iOS: Instalar o PWA (Adicionar à Tela de Início)

### Subscription não salva no Supabase

**Causa:** Tabela `user_profiles` não tem a coluna `push_subscription`

**Solução:** Execute o SQL acima (Passo 1)

---

## ✅ Checklist de Validação

- [x] `.env.local` criado com VAPID keys
- [x] Build passa sem erros (`npm run build`)
- [x] Logs melhorados no código
- [x] Mensagens de erro específicas
- [ ] Variáveis configuradas no Supabase
- [ ] Teste local funcionando (`npm run preview`)
- [ ] Variáveis configuradas no Vercel
- [ ] Deploy em produção testado

---

**Data da Correção:** 17/11/2025  
**Status:** ✅ Resolvido
