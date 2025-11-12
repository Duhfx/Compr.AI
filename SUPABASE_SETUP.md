# 🔧 Setup do Supabase para Compartilhamento

## ⚠️ Importante

Você precisa executar o script SQL para criar as tabelas de compartilhamento no Supabase.

---

## 📋 Passo a Passo

### 1️⃣ Acessar o SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Compr.AI**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2️⃣ Executar o Script

1. Copie todo o conteúdo do arquivo: `supabase/setup-sharing-auth.sql`
2. Cole no editor SQL
3. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 3️⃣ Verificar Execução

Se tudo deu certo, você verá as mensagens:

```
✅ Tabela shared_lists criada com sucesso
✅ Tabela list_members criada com sucesso
🎉 Setup de compartilhamento concluído!
```

### 4️⃣ Testar no App

1. Faça login no app
2. Crie uma lista
3. Clique no ícone de compartilhar
4. Clique em "Gerar Código de Compartilhamento"
5. Deve funcionar! 🎉

---

## 🔍 Verificar Tabelas Criadas

Após executar o script, você pode verificar se as tabelas foram criadas:

1. Vá em **Table Editor** no menu lateral do Supabase
2. Você deve ver as novas tabelas:
   - `shared_lists`
   - `list_members`

---

## 🐛 Solução de Problemas

### Erro: "relation already exists"

Se você ver esse erro, significa que a tabela já existe. Está tudo OK! ✅

### Erro: "permission denied"

1. Verifique se você está usando o projeto correto
2. Certifique-se de ter permissões de admin

### Compartilhamento ainda não funciona

1. Verifique se executou o script SQL
2. Verifique o console do navegador (F12) para ver o erro exato
3. Confirme que as políticas RLS foram criadas:
   - Vá em **Table Editor** > `shared_lists` > **RLS Policies**
   - Deve haver 3 políticas criadas

---

## 📊 Estrutura das Tabelas

### `shared_lists`
Armazena os códigos de compartilhamento

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| list_id | UUID | ID da lista compartilhada |
| share_code | TEXT | Código de 6 caracteres (ex: ABC123) |
| owner_device_id | TEXT | ID do dono (userId ou deviceId) |
| permission | TEXT | 'edit' ou 'readonly' |
| created_at | TIMESTAMPTZ | Data de criação |
| expires_at | TIMESTAMPTZ | Data de expiração (opcional) |

### `list_members`
Rastreia quem tem acesso a cada lista

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| list_id | UUID | ID da lista |
| device_id | TEXT | ID do membro (userId ou deviceId) |
| joined_at | TIMESTAMPTZ | Quando entrou |
| last_seen_at | TIMESTAMPTZ | Última visualização |
| is_active | BOOLEAN | Se ainda está ativo |

---

## ✅ Após o Setup

Depois de executar o script, você poderá:

- ✅ Gerar códigos de compartilhamento
- ✅ Compartilhar listas com outras pessoas
- ✅ Definir permissões (editar/visualizar)
- ✅ Configurar expiração de links
- ✅ Ver membros da lista

---

**Precisa de ajuda?** Verifique o console do navegador (F12) para ver os erros detalhados.
