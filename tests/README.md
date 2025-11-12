# 🧪 Testes das APIs - Compr.AI

Este diretório contém scripts de teste para validar as Vercel Functions antes do deploy.

---

## 📋 Pré-requisitos

1. **Variáveis de ambiente configuradas** em `.env.local`:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_KEY=sua-service-key
   GEMINI_API_KEY=sua-gemini-key
   ```

2. **Dependências instaladas**:
   ```bash
   # Raiz do projeto
   npm install

   # Pasta api/
   cd api && npm install && cd ..
   ```

3. **Vercel CLI instalado**:
   ```bash
   npm install -g vercel
   ```

---

## 🚀 Como Executar os Testes

### Opção 1: Testar Localmente (Recomendado)

1. **Iniciar servidor de desenvolvimento:**
   ```bash
   vercel dev
   ```

   O servidor irá iniciar em `http://localhost:3000`

2. **Em outro terminal, executar os testes:**

   ```bash
   # Testar todas as APIs
   npm run test:api

   # Testar apenas suggest-items
   npm run test:suggest

   # Testar apenas normalize-item
   npm run test:normalize
   ```

### Opção 2: Testar em Produção

```bash
# Após fazer deploy
TEST_URL=https://seu-app.vercel.app npm run test:api
```

---

## 📝 Testes Disponíveis

### 1. test-suggest-items.js

Testa a API `/api/suggest-items`

**Casos de teste:**
- ✅ Sugestão básica para "churrasco"
- ✅ Lista de café da manhã
- ❌ Requisição sem `deviceId` (erro esperado)
- ❌ Método GET não permitido (erro 405 esperado)

**Exemplo de saída esperada:**
```
🧪 Testando API: /api/suggest-items
📍 URL: http://localhost:3000/api/suggest-items

Test 1: Sugestão básica para "churrasco"
✅ Sucesso!
📋 Recebeu 5 sugestões:
   1. Carne Bovina (2 kg) - Alimentos
   2. Linguiça (1 kg) - Alimentos
   3. Carvão (1 kg) - Outros
   4. Sal Grosso (500 g) - Alimentos
   5. Pão de Alho (4 un) - Alimentos
```

### 2. test-normalize-item.js

Testa a API `/api/normalize-item`

**Casos de teste:**
- ✅ "leite integral itambé" → "Leite Integral 1L"
- ✅ "ARROZ TIPO 1 5KG" → "Arroz Tipo 1 5kg"
- ✅ "pao frances" → "Pão Francês"
- ❌ Requisição sem `rawName` (erro esperado)
- ❌ String vazia (erro esperado)
- ❌ Método GET não permitido (erro 405 esperado)

**Exemplo de saída esperada:**
```
🧪 Testando API: /api/normalize-item
📍 URL: http://localhost:3000/api/normalize-item

Test 1: Normalizar "leite integral itambé"
✅ Sucesso!
   Original:    "leite integral itambé"
   Normalizado: "Leite Integral 1L"
   Categoria:   Alimentos
   Unidade:     L
   ✓ Nome contém palavra-chave esperada
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@google/generative-ai'"

**Solução:** Instalar dependências na pasta `api/`:
```bash
cd api && npm install
```

### Erro: "GEMINI_API_KEY is not defined"

**Solução:** Configurar variáveis de ambiente:
```bash
# Criar .env.local na raiz
echo "GEMINI_API_KEY=sua-chave-aqui" >> .env.local

# Ou via Vercel (para produção)
vercel env add GEMINI_API_KEY
```

### Erro: "Connection refused" ao rodar testes

**Solução:** Verificar se `vercel dev` está rodando:
```bash
# Em um terminal
vercel dev

# Em outro terminal
npm run test:api
```

### Testes passam localmente mas falham em produção

**Possíveis causas:**
1. Variáveis de ambiente não configuradas na Vercel
2. Dependências não instaladas (falta `api/package.json`)
3. Rate limit da API do Gemini

**Solução:**
```bash
# Verificar variáveis de ambiente
vercel env ls

# Verificar logs
vercel logs

# Redeployar
vercel --prod
```

---

## ✅ Checklist de Validação

Antes de fazer deploy em produção, certifique-se:

- [ ] `vercel dev` funciona sem erros
- [ ] `npm run test:suggest` passa todos os testes
- [ ] `npm run test:normalize` passa todos os testes
- [ ] Respostas da IA são coerentes (não gibberish)
- [ ] Tempo de resposta < 5 segundos
- [ ] Erros retornam status codes corretos (400, 405, 500)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `api/package.json` existe e tem as dependências corretas

---

## 📊 Métricas de Performance

**Tempos esperados (após cold start):**

| API | Tempo Médio | Máximo Aceitável |
|-----|-------------|------------------|
| `/api/suggest-items` | 1-3s | 5s |
| `/api/normalize-item` | 0.5-2s | 3s |

**Cold start:** Primeira requisição pode levar 2-5s adicionais.

---

## 🔄 Próximos Passos

Após todos os testes passarem:

1. Commitar mudanças:
   ```bash
   git add .
   git commit -m "test: add API test scripts"
   git push
   ```

2. Deploy em produção:
   ```bash
   vercel --prod
   ```

3. Testar em produção:
   ```bash
   TEST_URL=https://seu-app.vercel.app npm run test:api
   ```

4. Monitorar logs:
   ```bash
   vercel logs --follow
   ```

---

**Desenvolvido com testes 🧪 | Compr.AI v0.3.0**
