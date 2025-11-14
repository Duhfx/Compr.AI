# 🛒 Compr.AI - Lista de Compras Inteligente

PWA inteligente de lista de compras com sincronização em tempo real, sugestões por IA e OCR de notas fiscais.

## ✨ Versão Atual: v1.8.0

Landing page mobile-first redesenhada + Sistema completo de IA e OCR

## 🚀 Stack Tecnológica

- **Frontend:** React 18 + Vite 5 + TypeScript 5
- **UI/Styling:** Tailwind CSS 3 + Framer Motion
- **Armazenamento:** Dexie.js (IndexedDB) - Offline-first
- **Backend:** Vercel Functions (Serverless)
- **Database:** Supabase (PostgreSQL + Realtime)
- **IA:** Google Gemini 1.5 Flash
- **OCR:** Tesseract.js (local) + Cloud Vision (fallback)
- **Auth:** Supabase Auth (email/senha)
- **PWA:** vite-plugin-pwa + Workbox
- **Deploy:** Vercel

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- Login/Registro com Supabase Auth
- Proteção de rotas
- Gerenciamento de sessão

### ✅ Listas de Compras
- CRUD completo de listas e itens
- Armazenamento offline (IndexedDB)
- Sincronização em tempo real
- Categorização inteligente

### ✅ Inteligência Artificial
- **Sugestões personalizadas** com Gemini AI
- Criação de listas automáticas
- Análise de histórico de compras
- Prompt contextual (ex: "churrasco", "festa")

### ✅ OCR de Notas Fiscais
- Escaneamento via câmera
- Extração de produtos e preços
- Processamento local (Tesseract.js)
- Estruturação com IA

### ✅ Compartilhamento
- Códigos únicos de compartilhamento
- Sincronização em tempo real
- Gestão de membros
- Link de convite

### ✅ Histórico e Análise
- Histórico completo de compras
- Análise de preços
- Comparação ao longo do tempo
- Exportação de dados

### ✅ Interface
- **Landing page mobile-first** (v1.8.0)
- Design iOS-like (app nativo)
- Animações suaves
- PWA instalável
- Modo offline

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

### Guias Principais
- [**📖 Documentação Completa**](./docs/README.md) - Índice de toda a documentação
- [**🚀 Guia de Desenvolvimento**](./CLAUDE.md) - Instruções para desenvolvimento
- [**📋 Changelog**](./docs/releases/CHANGELOG.md) - Histórico de versões

### Features Implementadas
- [🔐 Autenticação](./docs/features/01-autenticacao.md) - Sistema de login/registro
- [🧠 Sugestões com IA](./docs/features/03-sugestoes-ia.md) - Gemini AI integration
- [🎨 Interface e Landing Page](./docs/features/08-interface.md) - Design mobile-first

### Documentação Técnica
- [🏗️ Arquitetura](./docs/technical/arquitetura.md) - Visão geral do sistema (em breve)
- [🗄️ Database Schema](./docs/technical/database.md) - Esquema do banco (em breve)

> **Nota:** A documentação foi reorganizada em módulos para facilitar a navegação. O arquivo original `FUNCIONALIDADES_1311.md` permanece disponível para referência histórica.

## 🐛 Problemas Conhecidos

Nenhum no momento. Reporte issues!

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ usando Claude Code**
