# ⚡ Guia Rápido de Teste Local

Execute estes comandos em ordem para testar as APIs localmente antes do deploy.

---

## 🔧 Setup Inicial (uma vez)

```bash
# 1. Instalar dependências do projeto
npm install

# 2. Instalar dependências das APIs
cd api
npm install
cd ..

# 3. Verificar se .env.local existe e tem as chaves necessárias
# Deve conter:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - GEMINI_API_KEY
```

---

## 🧪 Testar Localmente

### Passo 1: Iniciar servidor local

```bash
vercel dev
```

**Aguarde até ver:** `Ready! Available at http://localhost:3000`

### Passo 2: Em outro terminal, rodar os testes

```bash
# Testar todas as APIs
npm run test:api
```

**OU testar individualmente:**

```bash
# Apenas suggest-items
npm run test:suggest

# Apenas normalize-item
npm run test:normalize
```

---

## ✅ O que esperar

### Se tudo estiver funcionando:

```
🧪 Testando API: /api/suggest-items
📍 URL: http://localhost:3000/api/suggest-items

Test 1: Sugestão básica para "churrasco"
✅ Sucesso!
📋 Recebeu 5 sugestões:
   1. Carne Bovina (2 kg) - Alimentos
   2. Linguiça (1 kg) - Alimentos
   3. Carvão (1 kg) - Outros
   ...
```

### Se houver erro de API key:

```
❌ Erro: GEMINI_API_KEY is not defined
```

**Solução:** Adicionar no `.env.local`:
```env
GEMINI_API_KEY=sua-chave-aqui
```

---

## 🚀 Após Testes Passarem

1. **Commitar mudanças:**
   ```bash
   git add .
   git commit -m "fix: add API dependencies and tests"
   git push
   ```

2. **Deploy em produção:**
   ```bash
   vercel --prod
   ```

3. **Configurar variável de ambiente na Vercel:**
   ```bash
   vercel env add GEMINI_API_KEY
   # Cole sua chave quando solicitado
   ```

4. **Testar em produção:**
   ```bash
   TEST_URL=https://seu-app.vercel.app npm run test:api
   ```

---

## 🐛 Erros Comuns

| Erro | Solução |
|------|---------|
| `Cannot find module '@google/generative-ai'` | `cd api && npm install` |
| `GEMINI_API_KEY is not defined` | Adicionar em `.env.local` |
| `Connection refused` | Verificar se `vercel dev` está rodando |
| `ECONNRESET` | Rate limit do Gemini, aguardar 1 minuto |

---

**Pronto para testar! 🎯**
