# 🛒 Compr.AI — Roadmap de Desenvolvimento

**Tipo:** PWA Inteligente de Lista de Compras  
**Stack:** React + Vite (frontend PWA) · .NET 8 Minimal API (backend) · Gemini AI  
**Banco:** SQLite local + sincroniza com PostgreSQL ou Supabase  
**IA:** Gemini 1.5 Pro para sugestões, OCR e chat contextual

---

## 🧩 Release 1 — MVP Base (Fundamentos do App)
**Objetivo:** Permitir criar e gerenciar listas de compras com armazenamento local e sincronização básica.

### Features
- Criar, editar e excluir listas de compras.
- Adicionar, editar e remover itens manualmente.
- Armazenar dados localmente (IndexedDB / LocalStorage).
- UI responsiva em modo PWA (instalável e offline-first).
- Sincronização simples com backend (upload/download de listas).

### Dicas Técnicas
- **Frontend:** React + Vite + IndexedDB via Dexie.js.
- **Backend:** .NET 8 Minimal API com endpoints RESTful.
- **PWA:** Service Worker + manifest.json configurados.
- **Auth (Simples):** Identificação por nome/apelido local (sem login).

### Complexidade: 🟢 Baixa

---

## 🤝 Release 2 — Compartilhamento e Sincronização
**Objetivo:** Permitir que o usuário compartilhe listas com outros e mantenha dados sincronizados.

### Features
- Geração de **código de compartilhamento (UUID)**.
- Importação de lista via código.
- Sincronização bidirecional automática (Firebase Realtime DB, Supabase Realtime ou backend WebSocket).
- Permissões de edição/leitura.

### Dicas Técnicas
- **Backend:** Adicionar camada SignalR para atualizações em tempo real.
- **Banco:** Sincronização incremental (timestamp + hash por item).
- **UI:** Indicar usuários conectados à lista compartilhada.

### Complexidade: 🟡 Média

---

## 🧠 Release 3 — Inteligência de Sugestões (Gemini)
**Objetivo:** Tornar o app proativo, sugerindo itens e aprendendo com o usuário.

### Features
- Sugestão automática de itens baseados em histórico.
- Preenchimento automático de categorias e quantidades.
- Interpretação de texto livre (ex: “Fazer lista de churrasco”).
- Padronização de nomes via IA (ex: "Leite Integral Itambé" → "Leite Integral 1L").

### Dicas Técnicas
- **IA:** Gemini 1.5 Pro com contexto dos últimos 50 itens do usuário.
- **Prompt:** descrever tipo de lista + histórico e pedir sugestões JSON.
- **Armazenamento:** manter embeddings locais (texto + vetores) para acelerar sugestões offline.

### Complexidade: 🟠 Média/Alta

---

## 📸 Release 4 — OCR e Leitura de Notas Fiscais
**Objetivo:** Automatizar o registro de preços e criar base de histórico de consumo.

### Features
- Escanear nota fiscal ou cupom via câmera.
- Extrair texto via **ML Kit (offline)**.
- Enviar texto bruto ao **Gemini** para estruturar itens e valores.
- Associar automaticamente os produtos reconhecidos ao histórico.

### Dicas Técnicas
- **OCR:** ML Kit local (sem enviar imagem à nuvem).
- **Gemini:** apenas texto OCR tratado (seguro e leve).
- **UX:** permitir confirmação manual antes de gravar.
- **Banco:** tabela `produto_preco_historico` (ProdutoID, Data, Valor).

### Complexidade: 🟡 Média

---

## 💬 Release 5 — Chat e Previsão de Gastos Inteligente
**Objetivo:** Transformar o Compr.AI em um assistente de compras completo.

### Features
- Chat com IA contextual: responder perguntas sobre listas e histórico.
- Previsão de gasto total com base em histórico pessoal (sem APIs externas).
- Dicas de economia (“use marca Y para reduzir em 10%”).
- Estatísticas: itens mais comprados, gasto mensal, variação de preços.

### Dicas Técnicas
- **Gemini Contextual:** incluir histórico do usuário no prompt (JSON resumido).
- **Modelos Locais:** média móvel e desvio padrão para cada produto.
- **Chat UI:** estilo WhatsApp com respostas estruturadas e links para a lista.

### Complexidade: 🔴 Alta

---

## 🔚 Release Extra — Refinamento e Monetização
**Objetivo:** Tornar o produto pronto para uso em escala.

### Features
- Modo Premium (assinatura mensal): IA avançada, exportação e relatórios.
- PWA completo com push notifications e atualização em background.
- Métricas de uso e logs de IA (para melhorias futuras).

### Complexidade: 🟡 Média

---

## 🧭 Resumo de Tecnologias
| Camada | Stack | Finalidade |
|--------|--------|-------------|
| Frontend | React + Vite + Tailwind | PWA responsivo, offline, instalável |
| Backend | .NET 8 Minimal API | API REST, sincronização e IA Gateway |
| Banco | SQLite (local) / PostgreSQL / Supabase | Dados locais e globais |
| IA | Gemini 1.5 Pro / Flash | Sugestões, OCR, chat e previsão |
| OCR | ML Kit (WebAssembly ou Flutter) | Leitura de notas fiscais offline |

---

## 🗃️ Sugestões de Bancos de Dados

### 1. **SQLite (Local)**
- Operar offline com sincronização posterior.
- Leve e integrado facilmente via IndexedDB wrapper.

### 2. **PostgreSQL (Cloud)**
- Alta performance e compatibilidade com JSONB.
- Ideal para consolidar dados de usuários e relatórios globais.

### 3. **Supabase (BaaS Completo)**
- Alternativa moderna ao Firebase com suporte a SQL nativo.
- Inclui Realtime, Auth, Storage e funções serverless.
- Integração direta com React e Typescript.

---

## 🪄 Próximos Passos
1. Criar repositório base (frontend + backend).
2. Implementar estrutura PWA (Release 1).
3. Configurar integração com Gemini via backend seguro.
4. Definir prompts padrões (Sugestões / OCR / Chat).
5. Validar fluxo de dados e UX com usuários reais.

