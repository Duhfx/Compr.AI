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

  try {
    const { userId, prompt, listType, maxResults = 10 } = req.body as SuggestionRequest;
    console.log('[suggest-items] Request params:', { userId, prompt, listType, maxResults });

    // Validação básica
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Cliente Supabase (com service key para acesso admin)
    console.log('[suggest-items] Creating Supabase client');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Buscar histórico do usuário (últimos 50 itens únicos)
    console.log('[suggest-items] Fetching purchase history for user:', userId);
    const { data: history, error: historyError } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('user_id', userId)
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
Você é um assistente de lista de compras inteligente para o mercado BRASILEIRO.

**Histórico do usuário** (produtos mais comprados):
${topItems.map(item => `- ${item.name} (${item.category || 'Sem categoria'}, ${item.frequency}x)`).join('\n')}

**Tarefa**: Sugerir até ${maxResults} itens para uma lista de compras.
${listType ? `**Tipo de lista**: ${listType}` : ''}
${prompt ? `**Contexto adicional**: ${prompt}` : ''}

**CONTEXTO BRASILEIRO - IMPORTANTE**:
- Sugira produtos COMUNS em supermercados brasileiros (Pão Francês, Leite Longa Vida, Café em pó, Feijão carioca/preto, Arroz tipo 1, etc.)
- Use unidades de medida brasileiras: kg, g, L, ml, un (unidade), pacote, lata, caixa, dúzia, maço
- Considere marcas e produtos típicos do Brasil quando relevante
- Para carnes: picanha, fraldinha, costela, linguiça toscana, file de frango, etc.
- Para laticínios: requeijão, queijo minas, iogurte natural, leite condensado, creme de leite
- Para básicos: feijão (carioca/preto), arroz, óleo de soja, açúcar cristal/refinado, sal
- Para temperos: alho, cebola, tomate, pimentão, cheiro-verde (salsinha e cebolinha), coentro
- Para bebidas: refrigerante, suco de caixinha, água mineral, cerveja, guaraná

**Categorias sugeridas**:
- Alimentos (Grãos, Massas, Cereais)
- Carnes e Frios (Bovina, Suína, Frango, Peixes)
- Hortifruti (Verduras, Legumes, Frutas)
- Laticínios e Frios
- Bebidas (Não alcoólicas, Alcoólicas)
- Padaria e Confeitaria
- Limpeza
- Higiene Pessoal
- Pet (Ração, Produtos para animais)
- Mercearia (Temperos, Condimentos, Enlatados)

**Exemplos DETALHADOS de listas típicas brasileiras**:

📌 **CHURRASCO** (na churrasqueira):
   ✅ SUGIRA: Picanha, Fraldinha, Costela, Maminha, Cupim, Linguiça toscana/calabresa, Coração de frango, Pão de alho, Farofa pronta, Vinagrete, Carvão, Cerveja, Refrigerante, Gelo, Sal grosso
   ❌ NÃO SUGIRA: Carne moída, Peito de frango, Filé de frango (essas são para frigideira/forno, não churrasqueira!)

📌 **FEIJOADA** (refeição tradicional):
   ✅ SUGIRA: Feijão preto, Costelinha de porco, Paio, Linguiça calabresa, Bacon, Orelha de porco, Laranja, Couve-manteiga, Arroz branco, Farofa, Torresmo
   ❌ NÃO SUGIRA: Feijão carioca, Alface, Frango

📌 **CAFÉ DA MANHÃ**:
   ✅ SUGIRA: Pão francês, Pão de forma, Manteiga, Margarina, Café em pó, Leite integral, Queijo minas, Presunto, Requeijão, Frutas (banana, maçã, mamão), Suco de laranja, Achocolatado
   ❌ NÃO SUGIRA: Arroz, Feijão, Carnes

📌 **LANCHE DA TARDE**:
   ✅ SUGIRA: Biscoito (água e sal, maisena, recheado), Achocolatado em pó, Leite, Pão de forma, Requeijão, Bolo pronto, Iogurte, Frutas
   ❌ NÃO SUGIRA: Almoço completo, Carnes pesadas

📌 **FEIRA / HORTIFRUTI**:
   ✅ SUGIRA: Tomate, Cebola, Alho, Batata, Cenoura, Alface, Rúcula, Couve, Banana, Maçã, Laranja, Limão, Mamão, Melancia
   ❌ NÃO SUGIRA: Produtos industrializados, Carnes, Laticínios

📌 **ALMOÇO DE DOMINGO** (refeição familiar):
   ✅ SUGIRA: Arroz branco, Feijão carioca, Carne (alcatra, patinho, frango), Batata, Cenoura, Alface, Tomate, Refrigerante, Sobremesa
   ❌ NÃO SUGIRA: Apenas lanches rápidos

📌 **FESTA INFANTIL**:
   ✅ SUGIRA: Salgadinhos, Refrigerante, Suco, Bolo, Doces, Guardanapo, Copinho descartável, Pratinho descartável
   ❌ NÃO SUGIRA: Bebidas alcoólicas, Carnes cruas

📌 **COMPRAS DO MÊS** (estoque):
   ✅ SUGIRA: Arroz (5kg), Feijão (2-3kg), Óleo de soja, Açúcar, Sal, Café (500g), Macarrão, Molho de tomate, Papel higiênico, Sabão em pó, Detergente
   ❌ NÃO SUGIRA: Apenas produtos perecíveis

**INSTRUÇÕES CRÍTICAS**:
1. **LEIA COM ATENÇÃO o tipo de lista e contexto** - "churrasco" significa CHURRASQUEIRA, não qualquer carne!
2. **Baseie-se no histórico do usuário** quando disponível
3. **Seja ESPECÍFICO ao contexto** - não misture itens de café da manhã em lista de churrasco
4. **Use quantidades REALISTAS**:
   - Churrasco para 6-8 pessoas: 1,5-2kg de carne no total
   - Feira semanal: 2-3kg de cada verdura/legume
   - Compras do mês: 5kg arroz, 2kg feijão, 1L óleo
5. **Evite quantidades absurdas**: não sugira 10kg de picanha nem 50g de arroz
6. **Use nomes brasileiros**: "Pão Francês" (não "baguette"), "Requeijão" (não "cream cheese"), "Linguiça toscana" (não "sausage")
7. **Considere o clima/região**: Produtos sazonais brasileiros (ex: manga no verão, morango no inverno)
8. **Pense como um brasileiro fazendo compras**: O que você REALMENTE compraria para essa ocasião?

**⚠️ ERROS COMUNS A EVITAR**:
- ❌ Sugerir "carne moída" para churrasco (é para frigideira, não churrasqueira!)
- ❌ Sugerir "peito de frango" para churrasco (prefira coração de frango, linguiça)
- ❌ Misturar contextos (ex: arroz e feijão em lista de café da manhã)
- ❌ Ignorar a ocasião (ex: sugerir apenas 200g de carne para churrasco de 8 pessoas)
- ❌ Usar nomes estrangeiros quando existe nome brasileiro comum
- ❌ Sugerir produtos que não existem ou são raros no Brasil

**ANTES DE RESPONDER, PERGUNTE-SE**:
1. Os itens fazem sentido para a ocasião/contexto pedido?
2. As quantidades são realistas para uma família/grupo brasileiro?
3. Esses produtos são fáceis de encontrar em supermercados brasileiros?
4. Estou usando os nomes que os brasileiros usam no dia a dia?

**IMPORTANTE**: Retorne APENAS um JSON válido, sem markdown, sem explicações:

{
  "items": [
    {
      "name": "Arroz tipo 1",
      "quantity": 2,
      "unit": "kg",
      "category": "Alimentos"
    },
    {
      "name": "Feijão carioca",
      "quantity": 1,
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
