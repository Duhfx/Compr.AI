# 🔧 Corrigir VAPID Keys no Vercel

## 🚨 PROBLEMA

A VAPID public key e private key no Vercel **NÃO CORRESPONDEM**.

**Detectado em produção:**
- Public Key: `BOjRZPFki2Uu2qyKF7xc...` (88 chars) ✅ Formato OK
- Private Key: Provavelmente diferente ❌ Não forma um par válido

**Resultado:** `AbortError: Registration failed - push service error`

---

## ✅ SOLUÇÃO

Substituir TODAS as VAPID keys no Vercel por um par válido.

### Passo 1: Acessar Vercel Dashboard

1. Vá em: https://vercel.com/dashboard
2. Selecione seu projeto: **Compr.AI**
3. Vá em: **Settings → Environment Variables**

### Passo 2: Deletar as Variáveis Existentes

**Delete estas variáveis (se existirem):**
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### Passo 3: Adicionar as Novas Keys

**Adicione estas 3 variáveis com EXATAMENTE estes valores:**

#### 1️⃣ VITE_VAPID_PUBLIC_KEY

- **Nome:** `VITE_VAPID_PUBLIC_KEY`
- **Valor:** `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8`
- **Ambientes:** ✅ Production | ✅ Preview | ✅ Development
- Clique em **Save**

#### 2️⃣ VAPID_PUBLIC_KEY

- **Nome:** `VAPID_PUBLIC_KEY`
- **Valor:** `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8`
- **Ambientes:** ✅ Production | ✅ Preview | ✅ Development
- Clique em **Save**

#### 3️⃣ VAPID_PRIVATE_KEY

- **Nome:** `VAPID_PRIVATE_KEY`
- **Valor:** `n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE`
- **Ambientes:** ✅ Production | ✅ Preview | ✅ Development
- Clique em **Save**

### Passo 4: Redeploy

1. Vá em: **Deployments**
2. Clique no deploy mais recente
3. Clique em **⋯ (três pontos)** → **Redeploy**
4. Confirme: **Redeploy**

### Passo 5: Testar

1. Aguarde o deploy finalizar (1-2 minutos)
2. Abra seu app: `https://seu-app.vercel.app`
3. Abra o Console (F12)
4. Faça login
5. Clique em "Permitir Notificações"

**Logs esperados (sucesso):**
```
[usePushNotifications] VAPID public key presente: true
[usePushNotifications] VAPID public key length: 87
[usePushNotifications] VAPID public key (primeiros 20 chars): BO84jrcAgkSLCEeHJAE...
[usePushNotifications] VAPID key convertida, tamanho: 65
[usePushNotifications] Subscription criada com sucesso! ✅
```

Se ver `BO84jrcAgkSLCEeHJAE...` no log, significa que as keys foram atualizadas! ✅

---

## 🎯 Por Que Isso Resolve?

VAPID keys vêm em **pares** (como chave pública/privada):

```
Public Key:  BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8
Private Key: n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE
```

**Antes:** Você tinha uma public key X e private key Y (não correspondiam) ❌  
**Depois:** Public key e private key do mesmo par ✅

Quando o browser tenta criar Push Subscription:
1. Usa a public key para assinar a requisição
2. Push service valida com a private key no servidor
3. **Se não correspondem, rejeita com AbortError**

---

## 🔍 Como Verificar se Funcionou

### Verificar via CLI

```bash
vercel env ls | grep VAPID
```

Deve mostrar:
```
VITE_VAPID_PUBLIC_KEY (Production, Preview, Development)
VAPID_PUBLIC_KEY (Production, Preview, Development)  
VAPID_PRIVATE_KEY (Production, Preview, Development)
```

### Verificar em Produção

Após redeploy, os logs devem mostrar:
```
VAPID public key (primeiros 20 chars): BO84jrcAgkSLCEeHJAE...
```

**Se ainda mostrar `BOjRZPFki2Uu2qyKF7xc...`, o Vercel não atualizou. Tente:**
1. Limpar cache do build: `vercel --force` ou dashboard → Redeploy (check "Use existing build cache" OFF)
2. Esperar alguns minutos e redeploy novamente

---

## ⚠️ IMPORTANTE

**Copie EXATAMENTE como está acima, sem:**
- ❌ Espaços no início ou fim
- ❌ Quebras de linha
- ❌ Aspas
- ❌ Caracteres extras

**Tamanhos corretos:**
- Public Key: 87 chars
- Private Key: 43 chars

---

**Última atualização:** 17/11/2025
