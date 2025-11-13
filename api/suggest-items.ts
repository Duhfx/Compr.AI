// api/suggest-items.ts
// Release 3: AI-powered item suggestions based on user history

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

interface SuggestionRequest {
  userId: string;
  prompt?: string;
  listType?: string;
  maxResults?: number;
}

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface SuggestionResponse {
  items: SuggestedItem[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[suggest-items] Function invoked');
  console.log('[suggest-items] Method:', req.method);
  console.log('[suggest-items] Node version:', process.version);
  console.log('[suggest-items] Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });

  // Validar método
  if (req.method !== 'POST') {
    console.log('[suggest-items] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar variáveis de ambiente
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.GEMINI_API_KEY) {
    console.error('[suggest-items] Missing required environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables'
    });
  }

  try {
    const { userId, prompt, listType, maxResults = 10 } = req.body as SuggestionRequest;
    console.log('[suggest-items] Request params:', { userId, prompt, listType, maxResults });

    // Validação básica
    if (!userId) {
      console.log('[suggest-items] Missing userId in request');
      return res.status(400).json({ error: 'userId is required' });
    }

    // Cliente Supabase (com service key para acesso admin)
    console.log('[suggest-items] Creating Supabase client');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Buscar histórico do usuário (últimos 50 itens únicos)
    // IMPORTANTE: Filtra apenas itens de listas que ainda existem (list_id NOT NULL)
    // Quando uma lista é deletada, list_id vira NULL (ON DELETE SET NULL)
    console.log('[suggest-items] Fetching purchase history for user:', userId);
    const { data: history, error: historyError } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('user_id', userId)
      .not('list_id', 'is', null)  // Exclui itens de listas deletadas
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('[suggest-items] Error fetching history:', historyError);
    } else {
      console.log('[suggest-items] Found', history?.length || 0, 'history items');
    }

    // Agregar itens mais comprados
    const itemFrequency = new Map<string, { count: number; category?: string; unit: string }>();
    if (history) {
      history.forEach((item) => {
        const existing = itemFrequency.get(item.item_name) || { count: 0, unit: 'un' };
        itemFrequency.set(item.item_name, {
          count: existing.count + 1,
          category: item.category || existing.category,
          unit: item.unit || existing.unit
        });
      });
    }

    const topItems = Array.from(itemFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        category: data.category,
        unit: data.unit,
        frequency: data.count
      }));

    // Chamar Gemini AI
    console.log('[suggest-items] Initializing Gemini AI with model: gemini-2.5-flash-lite');
    console.log('[suggest-items] Top items for context:', topItems.length);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `
Você é um assistente brasileiro especializado em listas de compras para supermercados do Brasil.

═══════════════════════════════════════════════════════════════════
🎯 SOLICITAÇÃO DO USUÁRIO
═══════════════════════════════════════════════════════════════════
${prompt ? `"${prompt}"` : 'Lista de compras genérica'}
${listType ? `Tipo: ${listType}` : ''}

═══════════════════════════════════════════════════════════════════
📊 HISTÓRICO DE COMPRAS DO USUÁRIO (use como referência)
═══════════════════════════════════════════════════════════════════
${topItems.length > 0 ? topItems.map(item => `• ${item.name} (${item.frequency}x comprado)`).join('\n') : 'Nenhum histórico disponível'}

═══════════════════════════════════════════════════════════════════
⚠️ REGRAS CRÍTICAS - LEIA ANTES DE SUGERIR
═══════════════════════════════════════════════════════════════════

🔴 REGRA 1 - CARNES PARA CHURRASCO (CHURRASQUEIRA):
Se a solicitação mencionar "churrasco", "churrasqueira", "grelhar", "assar na brasa":
   ✅ APENAS SUGIRA: Picanha, Fraldinha, Costela, Maminha, Cupim, Alcatra, Contra-filé, Linguiça toscana, Linguiça calabresa, Coração de frango
   ❌ NUNCA SUGIRA: Carne moída, Carne de panela, Peito de frango, Filé de frango, Patinho moído

🔴 REGRA 2 - QUANTIDADES REALISTAS:
   • 2 pessoas = 0,6-0,8kg de carne total
   • 4 pessoas = 1,2-1,5kg de carne total
   • 6-8 pessoas = 2-2,5kg de carne total
   • 10+ pessoas = 3-4kg de carne total

🔴 REGRA 3 - PRODUTOS BRASILEIROS:
   ✅ Use nomes brasileiros: Pão Francês, Requeijão, Café em pó, Feijão carioca, Arroz tipo 1
   ❌ Evite: Baguette, Cream cheese, Coffee, Black beans, White rice

🔴 REGRA 4 - CONTEXTO ESPECÍFICO:
   • Churrasco → carne de churrasqueira + carvão + acompanhamentos + bebidas
   • Café da manhã → pão + café + leite + frios (SEM arroz, feijão, carnes)
   • Feira → verduras, legumes, frutas (SEM industrializados)
   • Feijoada → feijão preto + carnes de porco específicas + acompanhamentos

═══════════════════════════════════════════════════════════════════
📋 GUIA DE PRODUTOS POR CONTEXTO
═══════════════════════════════════════════════════════════════════

🥩 CHURRASCO (churrasqueira):
Carnes: Picanha, Fraldinha, Costela, Maminha, Linguiça toscana, Coração de frango
Acompanhamentos: Pão de alho, Farofa pronta, Vinagrete (tomate/cebola/pimentão), Sal grosso
Essenciais: Carvão
Bebidas: Cerveja, Refrigerante, Água, Gelo

🍚 ALMOÇO BRASILEIRO:
Base: Arroz branco, Feijão carioca (ou preto)
Proteína: Bife (alcatra, patinho), Frango (sobrecoxa, filé), Peixe (tilápia, salmão)
Salada: Alface, Tomate, Cebola, Cenoura ralada
Complementos: Batata, Macarrão

🥖 CAFÉ DA MANHÃ:
Pães: Pão francês, Pão de forma integral
Laticínios: Manteiga, Margarina, Requeijão, Queijo minas, Leite
Bebidas: Café em pó, Achocolatado, Suco de laranja
Frios: Presunto, Queijo prato
Frutas: Banana, Mamão, Maçã

🥘 FEIJOADA:
Feijão preto, Costelinha de porco, Paio, Bacon, Linguiça calabresa
Acompanhamentos: Laranja, Couve-manteiga, Arroz branco, Farofa

🥬 FEIRA/HORTIFRUTI:
Verduras: Alface, Couve, Rúcula, Espinafre
Legumes: Tomate, Cebola, Batata, Cenoura, Abobrinha, Berinjela
Temperos: Alho, Pimentão, Cheiro-verde
Frutas: Banana, Maçã, Laranja, Mamão, Melancia, Abacaxi

═══════════════════════════════════════════════════════════════════
✅ ANTES DE RESPONDER - CHECKLIST
═══════════════════════════════════════════════════════════════════
1. Li a solicitação do usuário com ATENÇÃO?
2. Se é churrasco, estou sugerindo APENAS carnes de churrasqueira?
3. As quantidades fazem sentido para o número de pessoas?
4. Todos os produtos existem em supermercados brasileiros?
5. Usei nomes brasileiros comuns (não termos estrangeiros)?

═══════════════════════════════════════════════════════════════════
📤 FORMATO DE RESPOSTA (JSON VÁLIDO)
═══════════════════════════════════════════════════════════════════
Retorne APENAS JSON válido, sem markdown ou code blocks, sem explicações adicionais.

Exemplo para "churrasco para 2 pessoas":
{
  "items": [
    {
      "name": "Picanha",
      "quantity": 0.4,
      "unit": "kg",
      "category": "Carnes e Frios"
    },
    {
      "name": "Linguiça toscana",
      "quantity": 0.3,
      "unit": "kg",
      "category": "Carnes e Frios"
    },
    {
      "name": "Carvão",
      "quantity": 2,
      "unit": "kg",
      "category": "Mercearia"
    },
    {
      "name": "Pão de alho",
      "quantity": 1,
      "unit": "un",
      "category": "Padaria e Confeitaria"
    },
    {
      "name": "Farofa pronta",
      "quantity": 1,
      "unit": "pacote",
      "category": "Alimentos"
    },
    {
      "name": "Cerveja",
      "quantity": 6,
      "unit": "un",
      "category": "Bebidas"
    }
  ]
}

AGORA SUGIRA até ${maxResults} itens para a solicitação do usuário acima:
`.trim();

    console.log('[suggest-items] Calling Gemini API...');
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    console.log('[suggest-items] Gemini response received, length:', responseText.length);

    // Remover markdown se houver
    const cleanText = responseText.replace(/```json|```/g, '').trim();

    let suggestions: SuggestionResponse;
    try {
      suggestions = JSON.parse(cleanText);
      console.log('[suggest-items] Successfully parsed AI response');
    } catch (parseError) {
      console.error('[suggest-items] Failed to parse Gemini response:', cleanText);
      throw new Error('Invalid AI response format');
    }

    // Validar estrutura da resposta
    if (!suggestions.items || !Array.isArray(suggestions.items)) {
      console.error('[suggest-items] Invalid response structure:', suggestions);
      throw new Error('Invalid response structure from AI');
    }

    // Limitar número de resultados
    suggestions.items = suggestions.items.slice(0, maxResults);
    console.log('[suggest-items] Returning', suggestions.items.length, 'suggestions');

    return res.status(200).json(suggestions);

  } catch (error) {
    console.error('[suggest-items] ERROR:', error);
    console.error('[suggest-items] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
