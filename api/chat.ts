import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  userId: string;
  listId?: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

/**
 * Vercel Function: Chat contextual com Gemini AI
 *
 * Permite ao usuário fazer perguntas sobre:
 * - Suas listas de compras
 * - Histórico de compras
 * - Preços e tendências
 * - Sugestões de itens
 * - Estatísticas gerais
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, listId, message, conversationHistory = [] }: ChatRequest = req.body;

    // Validar inputs
    if (!userId || !message) {
      return res.status(400).json({
        error: 'Campos userId e message são obrigatórios'
      });
    }

    console.log('[API Chat] Nova mensagem do user:', userId);
    console.log('[API Chat] Mensagem:', message);
    console.log('[API Chat] ListId:', listId || 'nenhuma (contexto geral)');
    console.log('[API Chat] Histórico:', conversationHistory.length, 'mensagens');

    // Validar API key do Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.error('[API Chat] GEMINI_API_KEY não configurada');
      return res.status(500).json({
        error: 'Configuração do servidor incompleta'
      });
    }

    // Cliente Supabase
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

    // ============================================
    // Buscar contexto do usuário
    // ============================================

    // 1. Listas do usuário (últimas 5)
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id, name, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    // 2. Se há listId específico, buscar itens dessa lista
    let currentListItems = null;
    let currentListName = null;
    if (listId) {
      const { data: listData } = await supabase
        .from('shopping_lists')
        .select('name')
        .eq('id', listId)
        .single();

      currentListName = listData?.name;

      const { data: items } = await supabase
        .from('shopping_items')
        .select('name, quantity, unit, category, checked')
        .eq('list_id', listId)
        .eq('deleted', false)
        .order('checked', { ascending: true });

      currentListItems = items;
    }

    // 3. Histórico de compras (últimos 50 itens)
    const { data: purchaseHistory } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit, purchased_at')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    // 4. Histórico de preços (últimos 50)
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('item_name, price, store, purchased_at')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    // ============================================
    // Calcular estatísticas resumidas
    // ============================================

    const totalSpent = priceHistory?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
    const totalPurchases = purchaseHistory?.length || 0;

    // Itens mais comprados (top 5)
    const itemCountMap = new Map<string, number>();
    purchaseHistory?.forEach(p => {
      itemCountMap.set(p.item_name, (itemCountMap.get(p.item_name) || 0) + 1);
    });
    const mostPurchased = Array.from(itemCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count}x)`);

    // Gastos por categoria
    const categoryMap = new Map<string, number>();
    purchaseHistory?.forEach(p => {
      const cat = p.category || 'Outros';
      const priceMatch = priceHistory?.find(
        ph => ph.item_name === p.item_name &&
              new Date(ph.purchased_at).toDateString() === new Date(p.purchased_at).toDateString()
      );
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (priceMatch?.price || 0));
    });
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, total]) => `${cat} (R$ ${total.toFixed(2)})`);

    // ============================================
    // Montar contexto para o Gemini
    // ============================================

    const contextParts: string[] = [
      '=== CONTEXTO DO USUÁRIO ===',
      '',
      `Total de listas: ${lists?.length || 0}`,
      lists && lists.length > 0
        ? `Listas recentes: ${lists.map(l => `"${l.name}"`).join(', ')}`
        : '',
      '',
      `Total gasto (histórico): R$ ${totalSpent.toFixed(2)}`,
      `Total de compras registradas: ${totalPurchases}`,
      '',
      mostPurchased.length > 0
        ? `Itens mais comprados: ${mostPurchased.join(', ')}`
        : 'Ainda não há histórico de compras',
      '',
      topCategories.length > 0
        ? `Top categorias: ${topCategories.join(', ')}`
        : '',
    ];

    // Se há lista específica aberta
    if (currentListItems && currentListName) {
      const unchecked = currentListItems.filter(i => !i.checked);
      const checked = currentListItems.filter(i => i.checked);

      contextParts.push('');
      contextParts.push('=== LISTA ATUAL ===');
      contextParts.push(`Nome: "${currentListName}"`);
      contextParts.push(`Itens pendentes: ${unchecked.length}`);
      contextParts.push(`Itens comprados: ${checked.length}`);

      if (unchecked.length > 0) {
        contextParts.push('');
        contextParts.push('Itens pendentes:');
        unchecked.forEach(item => {
          contextParts.push(`- ${item.name} (${item.quantity} ${item.unit})${item.category ? ` - ${item.category}` : ''}`);
        });
      }

      if (checked.length > 0) {
        contextParts.push('');
        contextParts.push('Itens já comprados:');
        checked.forEach(item => {
          contextParts.push(`- ${item.name} ✓`);
        });
      }
    }

    const userContext = contextParts.filter(Boolean).join('\n');

    // ============================================
    // Chamar Gemini
    // ============================================

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: `Você é um assistente inteligente de compras chamado Compr.AI.

Seu papel:
- Ajudar o usuário a gerenciar suas listas de compras
- Responder perguntas sobre histórico, gastos e preços
- Sugerir itens baseado em padrões de compra
- Dar dicas práticas de organização e economia
- Ser conciso e direto (respostas com 2-4 parágrafos no máximo)

Tom:
- Amigável e prestativo
- Use emojis ocasionalmente (🛒 📝 💰 📊)
- Respostas curtas e objetivas
- Evite listas muito longas (máx 5 itens)

IMPORTANTE:
- Se o usuário perguntar sobre algo que NÃO está no contexto, seja honesto e diga que não há dados suficientes
- Não invente dados ou estatísticas
- Baseie-se APENAS no contexto fornecido abaixo

${userContext}`
    });

    // Converter histórico de conversação para formato Gemini
    const geminiHistory = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: geminiHistory
    });

    console.log('[API Chat] Enviando para Gemini...');
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    console.log('[API Chat] Resposta recebida:', responseText.substring(0, 100) + '...');

    return res.status(200).json({
      response: responseText,
      contextUsed: {
        listsCount: lists?.length || 0,
        currentList: currentListName || null,
        totalSpent,
        totalPurchases
      }
    });

  } catch (error) {
    console.error('[API Chat] Erro:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return res.status(500).json({
      error: 'Falha ao processar chat',
      message: errorMessage
    });
  }
}
