import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configurar VAPID keys para Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:noreply@compr-ai.vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listId, listName, currentUserId } = req.body;

    if (!listId || !listName || !currentUserId) {
      return res.status(400).json({
        error: 'Missing required fields: listId, listName, currentUserId'
      });
    }

    // Cliente Supabase (com service key para acesso admin)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar owner da lista
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError) {
      console.error('Error fetching list:', listError);
      return res.status(500).json({ error: 'Failed to fetch list' });
    }

    // Buscar membros da lista (excluindo o usuário atual)
    const { data: members, error: membersError } = await supabase
      .from('list_members')
      .select('user_id')
      .eq('list_id', listId)
      .neq('user_id', currentUserId) // Excluir quem está notificando
      .eq('is_active', true);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }

    // Combinar owner + membros (sem duplicatas)
    const allUserIds = new Set<string>();

    // Adicionar owner se não for o currentUserId
    if (list.user_id && list.user_id !== currentUserId) {
      allUserIds.add(list.user_id);
    }

    // Adicionar membros
    if (members && members.length > 0) {
      members.forEach(m => allUserIds.add(m.user_id));
    }

    console.log('[notify-members] Owner user_id:', list.user_id);
    console.log('[notify-members] Current user_id:', currentUserId);
    console.log('[notify-members] Members found:', members?.length || 0);
    console.log('[notify-members] Total unique user IDs to notify:', allUserIds.size);
    console.log('[notify-members] User IDs:', Array.from(allUserIds));

    if (allUserIds.size === 0) {
      return res.status(200).json({
        message: 'No members to notify',
        notifiedCount: 0
      });
    }

    // Buscar emails dos membros no auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    console.log('[notify-members] Total users in auth:', users.length);

    // Filtrar apenas os usuários que são membros da lista
    const memberEmails = users
      .filter(user => allUserIds.has(user.id))
      .map(user => user.email)
      .filter((email): email is string => !!email);

    console.log('[notify-members] Emails to notify:', memberEmails);

    // Buscar push subscriptions dos membros
    const { data: memberProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, push_subscription')
      .in('user_id', Array.from(allUserIds));

    const pushSubscriptions = (memberProfiles || [])
      .filter(profile => profile.push_subscription)
      .map(profile => ({
        userId: profile.user_id,
        subscription: profile.push_subscription
      }));

    console.log('[notify-members] Push subscriptions found:', pushSubscriptions.length);

    if (memberEmails.length === 0 && pushSubscriptions.length === 0) {
      return res.status(200).json({
        message: 'No members to notify',
        notifiedCount: 0
      });
    }

    // Buscar nome do usuário que está notificando da tabela user_profiles
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('nickname')
      .eq('user_id', currentUserId)
      .single();

    // Fallback para auth.users se não encontrar em user_profiles
    const currentUser = users.find(u => u.id === currentUserId);
    const notifierName = currentUserProfile?.nickname ||
                         currentUser?.user_metadata?.name ||
                         currentUser?.email?.split('@')[0] ||
                         'Um membro';

    console.log('[notify-members] Notifier name:', notifierName);

    // Enviar emails em paralelo
    const emailPromises = memberEmails.map(email =>
      resend.emails.send({
        from: 'Compr.AI <onboarding@resend.dev>', // Domínio padrão do Resend (gratuito)
        to: email,
        subject: `📝 ${listName} foi atualizada`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366F1 0%, #4338CA 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
                .button { display: inline-block; background: #6366F1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">📝 Lista Atualizada</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px; margin-bottom: 10px;">Olá! 👋</p>
                  <p style="font-size: 16px;">
                    <strong>${notifierName}</strong> atualizou a lista
                    <strong>"${listName}"</strong> no Compr.AI.
                  </p>
                  <p style="font-size: 16px; color: #6b7280;">
                    Confira as últimas alterações para manter suas compras sincronizadas com o grupo!
                  </p>
                  <div style="text-align: center;">
                    <a href="https://compr-ai.vercel.app" class="button">
                      Ver Lista Atualizada
                    </a>
                  </div>
                </div>
                <div class="footer">
                  <p>Você está recebendo este email porque é membro desta lista compartilhada.</p>
                  <p style="margin-top: 5px;">
                    <a href="https://compr-ai.vercel.app" style="color: #6366F1;">Compr.AI</a> -
                    Seu assistente de compras inteligente
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    );

    // Enviar push notifications em paralelo
    const pushPromises = pushSubscriptions.map(async ({ userId, subscription }) => {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: `📝 ${listName}`,
            body: `${notifierName} atualizou a lista`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: {
              url: `/list/${listId}`,
              listId,
              listName
            }
          })
        );
        return { userId, success: true };
      } catch (error: any) {
        // Se a subscription expirou (410 Gone), remover do banco
        if (error?.statusCode === 410) {
          console.log(`[notify-members] Subscription expirada para user ${userId}, removendo...`);
          await supabase
            .from('user_profiles')
            .update({ push_subscription: null })
            .eq('user_id', userId);
        }
        throw error;
      }
    });

    // Executar emails e push em paralelo
    const [emailResults, pushResults] = await Promise.all([
      Promise.allSettled(emailPromises),
      Promise.allSettled(pushPromises)
    ]);

    const emailSuccessCount = emailResults.filter(r => r.status === 'fulfilled').length;
    const emailFailedCount = emailResults.filter(r => r.status === 'rejected').length;
    const pushSuccessCount = pushResults.filter(r => r.status === 'fulfilled').length;
    const pushFailedCount = pushResults.filter(r => r.status === 'rejected').length;

    // Log detalhado dos resultados
    console.log(`[notify-members] Email results: ${emailSuccessCount} succeeded, ${emailFailedCount} failed`);
    console.log(`[notify-members] Push results: ${pushSuccessCount} succeeded, ${pushFailedCount} failed`);

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[notify-members] Failed to send email to ${memberEmails[index]}:`, result.reason);
      } else {
        console.log(`[notify-members] Successfully sent email to ${memberEmails[index]}`);
      }
    });

    pushResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[notify-members] Failed to send push to user ${pushSubscriptions[index].userId}:`, result.reason);
      } else {
        console.log(`[notify-members] Successfully sent push to user ${pushSubscriptions[index].userId}`);
      }
    });

    const totalNotified = emailSuccessCount + pushSuccessCount;

    return res.status(200).json({
      message: 'Notifications sent successfully',
      notifiedCount: totalNotified,
      emailsSent: emailSuccessCount,
      pushSent: pushSuccessCount,
      emailsFailed: emailFailedCount,
      pushFailed: pushFailedCount,
      totalMembers: allUserIds.size
    });

  } catch (error) {
    console.error('Error in notify-members:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
