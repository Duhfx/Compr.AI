# 🚀 Setup da Release 3 — Guia Rápido

Este guia mostra como configurar e testar a Release 3 do Compr.AI.

---

## 📦 1. Instalar Dependências

```bash
# Navegar para a pasta do projeto
cd C:\Compr.AI\comprai

# Instalar dependências do projeto (se ainda não instalou)
npm install

# As seguintes dependências já foram adicionadas:
# - @google/generative-ai (para Gemini AI)
# - @vercel/node (para Vercel Functions)
# - lucide-react (ícones)
```

---

## 🔑 2. Configurar API Keys

### 2.1 Gemini AI

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API key"
3. Copie a chave

### 2.2 Adicionar ao Projeto

**Opção A: Para desenvolvimento local** (teste via `vercel dev`)

Crie `.env.local` na raiz do projeto:

```env
# Frontend
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Backend (Vercel Functions)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
GEMINI_API_KEY=sua-gemini-key
```

**Opção B: Para produção na Vercel**

```bash
# Via CLI
vercel env add GEMINI_API_KEY
# Cole sua chave quando solicitado

# Ou via Dashboard:
# 1. Acesse https://vercel.com/seu-usuario/comprai/settings/environment-variables
# 2. Add New > Name: GEMINI_API_KEY > Value: sua-chave > Save
```

---

## 🗄️ 3. Aplicar Migrations no Supabase

### Opção A: Via CLI (recomendado)

```bash
# Instalar CLI do Supabase (se ainda não tem)
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto local com projeto Supabase
supabase link --project-ref seu-projeto-ref
# Encontre o ref em: https://supabase.com/dashboard/project/_/settings/general

# Aplicar migrations
supabase db push
```

### Opção B: Via Dashboard (manual)

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
2. Copie o conteúdo de `supabase/migrations/003_history.sql`
3. Cole no editor e clique "Run"
4. Repita com `supabase/migrations/004_price_history.sql`

**Verificar se funcionou:**

```sql
-- Rodar no SQL Editor do Supabase
SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_purchase';
-- Deve retornar 1 linha

SELECT tablename FROM pg_tables WHERE tablename = 'purchase_history';
-- Deve retornar 1 linha
```

---

## 🧪 4. Testar Localmente

### 4.1 Instalar Vercel CLI (se ainda não tem)

```bash
npm install -g vercel
```

### 4.2 Rodar em modo dev

```bash
# Isso inicia tanto o frontend (Vite) quanto as Vercel Functions
vercel dev
```

**Atenção**: O comando `vercel dev` pode pedir:

```
? Set up and develop "C:\Compr.AI\comprai"? [Y/n] Y
? Which scope should contain your project? seu-usuario
? Link to existing project? [Y/n] n
? What's your project's name? comprai
? In which directory is your code located? ./
```

### 4.3 Testar as APIs

Abra o navegador em `http://localhost:3000` e:

1. **Teste autocompletar**:
   - Abra uma lista
   - Digite no input de item
   - Veja sugestões aparecerem

2. **Teste criar lista com IA**:
   - Clique no botão "Com IA" (roxo)
   - Digite: "Lista para churrasco"
   - Veja a lista ser criada

3. **Teste histórico**:
   - Marque alguns itens como comprados
   - Abra DevTools > Application > IndexedDB > CompraiDB > purchaseHistory
   - Veja registros

---

## 🚀 5. Deploy em Produção

### 5.1 Deploy inicial

```bash
# Deploy (primeira vez)
vercel

# O CLI vai fazer algumas perguntas:
# Set up and develop? Y
# Which scope? seu-usuario
# Link to existing project? n
# Project name? comprai
# In which directory is your code located? ./
```

### 5.2 Deploy de produção

```bash
vercel --prod
```

### 5.3 Configurar domínio (opcional)

1. Acesse: https://vercel.com/seu-usuario/comprai/settings/domains
2. Adicione seu domínio personalizado
3. Siga instruções de DNS

---

## 🔍 6. Verificar Deploy

### 6.1 Verificar Vercel Functions

1. Acesse: https://vercel.com/seu-usuario/comprai/deployments
2. Clique no último deployment
3. Vá em "Functions"
4. Deve listar:
   - `api/suggest-items.ts`
   - `api/normalize-item.ts`

### 6.2 Testar endpoints

```bash
# Teste suggest-items
curl -X POST https://seu-app.vercel.app/api/suggest-items \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-123","prompt":"churrasco"}'

# Deve retornar JSON com items sugeridos
```

---

## ⚠️ 7. Troubleshooting Comum

### Problema: "GEMINI_API_KEY is not defined"

**Solução:**
```bash
# Verificar variáveis de ambiente
vercel env ls

# Se não aparecer GEMINI_API_KEY, adicionar:
vercel env add GEMINI_API_KEY

# Redeployar
vercel --prod
```

### Problema: Trigger de histórico não funciona

**Solução:**
```sql
-- No SQL Editor do Supabase, verificar:
SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_purchase';

-- Se não retornar nada, recriar:
-- (copiar conteúdo de supabase/migrations/003_history.sql)
```

### Problema: Erro CORS nas APIs

**Solução:**

Adicione `vercel.json` na raiz do projeto:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

### Problema: Sugestões muito lentas

**Possíveis causas:**
- Cold start da Vercel Function (primeira requisição ~2-3s)
- Rate limit do Gemini (15 req/min)

**Solução:**
- Aguardar segundo request (será mais rápido)
- Implementar cache local mais agressivo

---

## ✅ 8. Checklist de Conclusão

Marque conforme for concluindo:

- [ ] Dependências instaladas (`npm install`)
- [ ] API key do Gemini obtida
- [ ] Variáveis de ambiente configuradas (`.env.local` ou Vercel)
- [ ] Migrations aplicadas no Supabase
- [ ] `vercel dev` funcionando localmente
- [ ] Autocompletar testado e funcionando
- [ ] "Criar lista com IA" testado e funcionando
- [ ] Histórico de compras registrando
- [ ] Deploy em produção realizado
- [ ] APIs funcionando em produção

---

## 📚 Próximos Passos

Após configurar a Release 3:

1. **Coletar feedback**: Use o app e registre melhorias
2. **Preparar Release 4**: OCR de notas fiscais
3. **Otimizar prompts**: Refinar instruções para a IA
4. **Adicionar analytics**: Rastrear uso das features de IA

---

## 🆘 Precisa de Ajuda?

- **Logs da Vercel**: `vercel logs`
- **Logs do Supabase**: Dashboard > Logs
- **DevTools**: F12 > Console/Network

---

**Setup concluído! 🎉**

Agora você tem um assistente de compras inteligente funcionando com IA!
