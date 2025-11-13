# 📧 Configuração de Notificações por Email

Este guia explica como configurar o sistema de notificações por email usando **Resend**.

## 🎯 O que foi implementado

- **Botão de notificação** no cabeçalho da lista (ícone de sino 🔔)
- **API endpoint** `/api/notify-members` para enviar emails
- **Emails HTML bonitos** com informações da lista e quem fez a atualização
- **Toast notifications** mostrando quantos membros foram notificados

## 📋 Pré-requisitos

1. Conta no [Resend](https://resend.com) (plano gratuito: 3.000 emails/mês)
2. Acesso ao dashboard da Vercel
3. Domínio verificado no Resend (opcional, mas recomendado)

## 🚀 Passo a passo

### 1. Criar conta no Resend

1. Acesse [resend.com/signup](https://resend.com/signup)
2. Crie sua conta gratuita
3. Confirme seu email

### 2. Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: `Compr.AI Production`)
4. Selecione permissões: **Sending access**
5. Copie a API key gerada (começa com `re_...`)

⚠️ **Importante**: Guarde a key em local seguro, ela só será mostrada uma vez!

### 3. (Opcional) Configurar domínio customizado

Por padrão, os emails serão enviados de `onboarding@resend.dev`. Para usar seu próprio domínio:

1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `compr-ai.app`)
4. Adicione os registros DNS fornecidos no seu provedor de domínio:
   - Registro TXT para verificação
   - Registros MX para recebimento
   - Registro DKIM para autenticação
5. Aguarde a verificação (pode levar até 72h)

Depois de verificado, atualize o código em `api/notify-members.ts`:

```typescript
from: 'Compr.AI <noreply@seu-dominio.com>',
```

### 4. Configurar variável de ambiente no Vercel

#### Opção A: Via CLI (recomendado)

```bash
# Adicionar para Production
vercel env add RESEND_API_KEY production

# Adicionar para Preview
vercel env add RESEND_API_KEY preview

# Adicionar para Development
vercel env add RESEND_API_KEY development
```

Cole a API key quando solicitado.

#### Opção B: Via Dashboard

1. Acesse o dashboard da Vercel: https://vercel.com/eduardo-farias-projects-90435835/compr-ai/settings/environment-variables
2. Clique em **Add New**
3. Nome: `RESEND_API_KEY`
4. Valor: Cole sua API key do Resend
5. Ambientes: Marque **Production**, **Preview** e **Development**
6. Clique em **Save**

### 5. Redeploy da aplicação

Após adicionar a variável, faça um redeploy:

```bash
# Via CLI
vercel --prod

# Ou via Dashboard
# Vá em Deployments > Latest Deployment > ⋯ > Redeploy
```

## ✅ Testando

1. Acesse uma lista compartilhada no app
2. Clique no botão de sino 🔔 (notification bell)
3. Aguarde o toast "Enviando notificações..."
4. Verifique se aparece "X membros notificados!"
5. Confira os emails dos membros

### Exemplos de resposta

**Sucesso (com membros):**
```json
{
  "message": "Notifications sent successfully",
  "notifiedCount": 2,
  "failedCount": 0,
  "totalMembers": 2
}
```

**Sem membros:**
```json
{
  "message": "No members to notify",
  "notifiedCount": 0
}
```

## 🐛 Troubleshooting

### Erro: "RESEND_API_KEY is not defined"

- Verifique se a variável foi adicionada no Vercel
- Faça redeploy após adicionar a variável
- Certifique-se que marcou o ambiente correto (Production/Preview/Development)

### Emails não chegam

1. **Verifique spam/lixeira** - Emails de `onboarding@resend.dev` podem cair no spam
2. **Domínio não verificado** - Sem domínio próprio, alguns provedores bloqueiam
3. **Limite excedido** - Plano gratuito: 3.000 emails/mês, 100 emails/dia
4. **Email inválido** - Certifique-se que os membros têm emails válidos cadastrados

### Ver logs

```bash
# Logs da function no Vercel
vercel logs --follow

# Logs específicos de uma deployment
vercel logs <deployment-url>
```

Ou veja no dashboard: **Deployments > [sua deployment] > Functions > notify-members**

## 📊 Limites do plano gratuito (Resend)

- ✅ 3.000 emails por mês
- ✅ 100 emails por dia
- ✅ 1 domínio verificado
- ✅ Suporte básico

Para aumentar limites, considere o plano pago ($20/mês para 50k emails).

## 🔐 Segurança

- ✅ API key nunca é exposta no frontend
- ✅ Apenas membros ativos da lista recebem emails
- ✅ Quem clica no botão não recebe email (evita auto-notificação)
- ✅ Supabase Service Key usada apenas no backend
- ✅ Emails são enviados de forma assíncrona

## 📚 Recursos

- [Documentação Resend](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Verificação de domínio](https://resend.com/docs/dashboard/domains/introduction)
- [Templates HTML](https://resend.com/docs/send-with-nodejs#html-email)

## 💡 Melhorias futuras

- [ ] Templates de email mais elaborados
- [ ] Preferências de notificação por usuário
- [ ] Digest de notificações (agrupar várias atualizações)
- [ ] Notificações push (Web Push API)
- [ ] Webhooks para rastrear entregas e aberturas

---

**Última atualização:** 2025-11-13
