// api/suggest-items.ts
// Release 3: AI-powered item suggestions based on user history

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

interface SuggestionRequest {
  deviceId: string;
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

  try {
    const { deviceId, prompt, listType, maxResults = 10 } = req.body as SuggestionRequest;
    console.log('[suggest-items] Request params:', { deviceId, prompt, listType, maxResults });

    // Validação básica
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Cliente Supabase (com service key para acesso admin)
    console.log('[suggest-items] Creating Supabase client');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Buscar histórico do usuário (últimos 50 itens únicos)
    console.log('[suggest-items] Fetching purchase history for device:', deviceId);
    const { data: history, error: historyError } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('device_id', deviceId)
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
Você é um assistente de lista de compras inteligente.

**Histórico do usuário** (produtos mais comprados):
${topItems.map(item => `- ${item.name} (${item.category || 'Sem categoria'}, ${item.frequency}x)`).join('\n')}

**Tarefa**: Sugerir até ${maxResults} itens para uma lista de compras.
${listType ? `**Tipo de lista**: ${listType}` : ''}
${prompt ? `**Contexto adicional**: ${prompt}` : ''}

**Instruções**:
1. Baseie as sugestões no histórico do usuário sempre que possível
2. Para tipos específicos de lista (ex: "churrasco", "café da manhã"), sugira itens apropriados
3. Use quantidades realistas (ex: 1kg de arroz, não 10kg)
4. Categorize os itens corretamente (Alimentos, Bebidas, Limpeza, Higiene, etc.)
5. Priorize itens que o usuário já comprou no passado

**IMPORTANTE**: Retorne APENAS um JSON válido, sem markdown, sem explicações:

{
  "items": [
    {
      "name": "Arroz integral",
      "quantity": 2,
      "unit": "kg",
      "category": "Alimentos"
    }
  ]
}
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
