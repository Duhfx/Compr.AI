# ⚙️ Configurar Push Notifications no Vercel

## 🚨 PROBLEMA ATUAL

Você está vendo este erro em produção:
```
AbortError: Registration failed - push service error
```

**Causa:** As variáveis de ambiente (`VITE_VAPID_PUBLIC_KEY`, etc.) **NÃO estão configuradas no Vercel**.

---

## ✅ SOLUÇÃO: Adicionar Variáveis no Vercel

### Opção 1: Via Dashboard do Vercel (Recomendado)

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione seu projeto:** Compr.AI
3. **Vá em:** Settings → Environment Variables
4. **Adicione as seguintes variáveis:**

#### Frontend (IMPORTANTE: Use ambiente "Production", "Preview" e "Development")

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `VITE_VAPID_PUBLIC_KEY` | `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8` | ✅ Production<br>✅ Preview<br>✅ Development |
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | ✅ Production<br>✅ Preview<br>✅ Development |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key-aqui` | ✅ Production<br>✅ Preview<br>✅ Development |

#### Backend (Functions)

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `VAPID_PUBLIC_KEY` | `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8` | ✅ Production<br>✅ Preview<br>✅ Development |
| `VAPID_PRIVATE_KEY` | `n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE` | ✅ Production<br>✅ Preview<br>✅ Development |
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` | ✅ Production<br>✅ Preview<br>✅ Development |
| `SUPABASE_SERVICE_KEY` | `sua-service-role-key-aqui` | ✅ Production<br>✅ Preview<br>✅ Development |
| `GEMINI_API_KEY` | `sua-gemini-api-key-aqui` | ✅ Production<br>✅ Preview<br>✅ Development |
| `RESEND_API_KEY` | `sua-resend-api-key-aqui` | ✅ Production<br>✅ Preview<br>✅ Development |

5. **IMPORTANTE:** Clique em **"Save"** após cada variável
6. **Redeploy:** Após adicionar todas, vá em Deployments → (deploy mais recente) → ⋯ → Redeploy

---

### Opção 2: Via CLI (Vercel CLI)

```bash
# 1. Login no Vercel (se ainda não fez)
vercel login

# 2. Link com o projeto (se ainda não fez)
vercel link

# 3. Adicionar variáveis de ambiente
vercel env add VITE_VAPID_PUBLIC_KEY
# Quando perguntado:
# - Qual o valor? → Cole: BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8
# - Quais ambientes? → Selecione todos (Production, Preview, Development)

vercel env add VAPID_PUBLIC_KEY
# Cole: BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8

vercel env add VAPID_PRIVATE_KEY
# Cole: n9kWfR6ipyxmlCCzXdC5vuhgg172zAzsCEMy3rtq9CE

vercel env add VITE_SUPABASE_URL
# Cole: https://seu-projeto.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Cole sua anon key

vercel env add SUPABASE_URL
# Cole: https://seu-projeto.supabase.co

vercel env add SUPABASE_SERVICE_KEY
# Cole sua service role key

vercel env add GEMINI_API_KEY
# Cole sua Gemini API key

vercel env add RESEND_API_KEY
# Cole sua Resend API key

# 4. Redeploy
vercel --prod
```

---

## 🔍 Verificar se Funcionou

### 1. Verificar variáveis no Vercel

```bash
vercel env ls
```

Você deve ver todas as variáveis listadas:
```
VITE_VAPID_PUBLIC_KEY (Production, Preview, Development)
VAPID_PUBLIC_KEY (Production, Preview, Development)
VAPID_PRIVATE_KEY (Production, Preview, Development)
...
```

### 2. Testar em Produção

1. Abra seu app em produção: `https://seu-app.vercel.app`
2. Abra o Console do navegador (F12 → Console)
3. Faça login
4. Quando o modal de Push Notifications aparecer, clique em "Permitir"
5. Verifique os logs no console:

**✅ Logs esperados (sucesso):**
```
[usePushNotifications] VAPID public key presente: true
[usePushNotifications] VAPID public key length: 87 ou 88
[usePushNotifications] VAPID public key (primeiros 20 chars): BO84jrcAgkSLCEeHJAE...
[usePushNotifications] Service Worker registrado, criando subscription...
[usePushNotifications] VAPID key convertida, tamanho: 65
[usePushNotifications] Subscription criada com sucesso: {...}
```

**❌ Logs de erro (variável não configurada):**
```
[usePushNotifications] VAPID public key presente: false
❌ Erro: VAPID public key não configurada
```

---

## 🐛 Troubleshooting

### Erro: "VAPID public key presente: false"

**Causa:** Variável `VITE_VAPID_PUBLIC_KEY` não foi adicionada no Vercel

**Solução:**
1. Vá em Vercel Dashboard → Settings → Environment Variables
2. Adicione `VITE_VAPID_PUBLIC_KEY` com o valor: `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8`
3. **Importante:** Marque "Production", "Preview" e "Development"
4. Redeploy o projeto

### Erro: "VAPID key tem tamanho inválido"

**Causa:** VAPID key foi copiada incorretamente (com espaços ou quebras de linha)

**Solução:**
1. Delete a variável no Vercel
2. Adicione novamente, certificando-se de copiar exatamente: `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8`
3. Não adicione espaços, aspas ou quebras de linha
4. Redeploy

### Erro: "VAPID key inválida. Formato incorreto."

**Causa:** VAPID key está corrompida ou no formato errado

**Solução:**
1. Use exatamente a key gerada: `BO84jrcAgkSLCEeHJAE1lQM4XVWlwENwaOILySFKcudVHhRABSPHxTw-lkZe7WdYXG41GHLaKYCvx25y-sOL3A8`
2. Verifique se não há caracteres extras
3. Se persistir, gere uma nova key:
   ```bash
   npx -y web-push generate-vapid-keys
   ```
4. Atualize TODAS as 3 variáveis (VITE_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

### Ainda não funciona?

Execute este teste:

```bash
# 1. Verificar se as variáveis estão configuradas
vercel env ls | grep VAPID

# 2. Pull das variáveis (baixar localmente para testar)
vercel env pull .env.vercel

# 3. Ver o que foi baixado
cat .env.vercel | grep VAPID

# Se VITE_VAPID_PUBLIC_KEY não aparecer, a variável não foi adicionada!
```

---

## ✅ Checklist Final

- [ ] Todas as 9 variáveis adicionadas no Vercel
- [ ] Todas marcadas para Production, Preview e Development
- [ ] Redeploy feito após adicionar variáveis
- [ ] Testado em produção (https://seu-app.vercel.app)
- [ ] Console mostra "VAPID public key presente: true"
- [ ] Subscription criada com sucesso
- [ ] Notificação funciona

---

## 📞 Suporte

Se ainda tiver problemas:
1. Tire um print da tela de Environment Variables do Vercel
2. Copie os logs do console (F12)
3. Verifique se o build passou sem erros

**Última atualização:** 17/11/2025
