# 🛒 Compr.AI - Lista de Compras Inteligente

PWA inteligente de lista de compras com sincronização em tempo real e sugestões por IA.

## 🚀 Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5
- **Estilização:** Tailwind CSS 3
- **Armazenamento Local:** Dexie.js (IndexedDB)
- **Backend/Database:** Supabase (PostgreSQL + Realtime)
- **IA:** Google Gemini 1.5 (futuras releases)
- **PWA:** vite-plugin-pwa
- **Deploy:** Vercel

## 🎯 Release Atual: Release 1 - MVP Base

### Funcionalidades Implementadas

✅ CRUD de listas de compras
✅ CRUD de itens
✅ Armazenamento local (offline-first)
✅ Interface responsiva (mobile-first)
✅ PWA instalável
✅ Banco de dados Supabase configurado

### Próximas Releases

- **Release 2:** Compartilhamento e sincronização em tempo real
- **Release 3:** Sugestões inteligentes com IA
- **Release 4:** OCR de notas fiscais
- **Release 5:** Chat e previsão de gastos

## 🛠️ Setup do Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute a migration SQL em `supabase/migrations/001_initial_schema.sql`
3. Copie a URL e a anon key para o `.env.local`

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📱 Instalar como PWA

1. Abra o projeto no navegador
2. Procure pelo ícone de instalação na barra de endereços
3. Clique em "Instalar" ou "Adicionar à tela inicial"

## 🏗️ Estrutura do Projeto

```
comprai/
├── src/
│   ├── components/     # Componentes React
│   │   ├── layout/     # Header, Layout
│   │   ├── lists/      # ListCard
│   │   └── items/      # ItemRow, ItemModal
│   ├── pages/          # Home, ListDetail
│   ├── hooks/          # Custom hooks
│   ├── lib/            # DB, Supabase, utils
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # SQL migrations
└── public/             # Assets estáticos
```

## 📚 Documentação

- [Roadmap Detalhado](../ROADMAP_DETALHADO.md)
- [Guia de Desenvolvimento](../CLAUDE.md)

## 🐛 Problemas Conhecidos

Nenhum no momento. Reporte issues!

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ usando Claude Code**
