// api/validate-list.ts
// Validate if suggested items make sense for the original request

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ValidateRequest {
  originalPrompt: string;
  suggestedItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }>;
}

interface ValidateResponse {
  isValid: boolean;
  confidence: number; // 0-100
  issues: string[];
  suggestions: string[];
  validatedItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    shouldKeep: boolean;
    reason?: string;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[validate-list] Function invoked');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalPrompt, suggestedItems } = req.body as ValidateRequest;

    if (!originalPrompt || !suggestedItems || !Array.isArray(suggestedItems)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[validate-list] Validating', suggestedItems.length, 'items for prompt:', originalPrompt);

    // Inicializar Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `
Você é um validador de listas de compras para o mercado BRASILEIRO. Analise se os itens sugeridos fazem sentido para a solicitação original e para a realidade brasileira.

**Solicitação Original**: "${originalPrompt}"

**Itens Sugeridos**:
${suggestedItems.map((item, i) => `${i + 1}. ${item.name} (${item.quantity} ${item.unit}, ${item.category || 'Sem categoria'})`).join('\n')}

**Tarefa**: Avaliar se CADA item faz sentido para a solicitação E para o mercado brasileiro. Considere:

**1. Relevância para o contexto**:
   - O item é apropriado para a solicitação original?
   - Para listas temáticas (churrasco, feijoada, café da manhã), o item faz sentido?

**2. Disponibilidade no Brasil**:
   - O item é COMUM em supermercados brasileiros?
   - Prefira nomes brasileiros (ex: "Pão Francês" ao invés de "baguette", "Requeijão" ao invés de "cream cheese")
   - Evite produtos muito específicos de outros países

**3. Quantidades realistas**:
   - A quantidade é adequada para consumo familiar brasileiro?
   - Evite quantidades industriais (ex: 20kg de arroz) ou muito pequenas (50g de feijão)
   - Quantidades típicas: 1-2kg arroz, 1kg feijão, 1L óleo, 500g café

**4. Unidades de medida brasileiras**:
   - Verifique se usa unidades corretas: kg, g, L, ml, un, pacote, lata, caixa, dúzia, maço
   - Evite unidades estrangeiras (oz, lb, gallon)

**5. Completude da lista**:
   - Há itens essenciais faltando para a solicitação?
   - Para "churrasco": carne, carvão, farofa, bebidas?
   - Para "café da manhã": pão, café, leite, manteiga?
   - Para "almoço": arroz, feijão, proteína, salada?

**6. Duplicatas e redundâncias**:
   - Há itens duplicados ou muito similares?
   - Ex: "Arroz" e "Arroz tipo 1" é redundante

**CONTEXTO BRASILEIRO - Produtos comuns**:
- Básicos: Arroz tipo 1, Feijão carioca/preto, Óleo de soja, Açúcar, Sal, Café em pó
- Carnes: Picanha, Fraldinha, Costela, Linguiça toscana, Filé de frango
- Laticínios: Leite longa vida, Requeijão, Queijo minas, Iogurte natural
- Hortifruti: Tomate, Cebola, Alho, Batata, Cenoura, Alface, Banana, Laranja
- Bebidas: Refrigerante, Cerveja, Guaraná, Suco de caixinha
- Padaria: Pão francês, Pão de forma, Biscoito

**IMPORTANTE**: Retorne APENAS um JSON válido, sem markdown:

{
  "isValid": true,
  "confidence": 95,
  "issues": ["lista de problemas encontrados"],
  "suggestions": ["lista de melhorias sugeridas"],
  "validatedItems": [
    {
      "name": "nome do item",
      "quantity": 2,
      "unit": "kg",
      "category": "Alimentos",
      "shouldKeep": true,
      "reason": "Item relevante, comum no Brasil e quantidade apropriada"
    }
  ]
}

**Critérios de validação**:
- shouldKeep: true = item adequado (relevante, disponível no Brasil, quantidade ok)
- shouldKeep: false = item problemático (não faz sentido, quantidade inadequada, produto não comum)
- confidence: 0-100 (quão confiante você está na lista como um todo)
- isValid: true se >80% dos itens são válidos, false caso contrário
- issues: liste problemas específicos encontrados
- suggestions: sugira melhorias concretas (ex: "Adicionar carvão para o churrasco", "Trocar 'baguette' por 'Pão Francês'")
`.trim();

    console.log('[validate-list] Calling Gemini API...');
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Remover markdown se houver
    const cleanText = responseText.replace(/```json|```/g, '').trim();

    let validation: ValidateResponse;
    try {
      validation = JSON.parse(cleanText);
      console.log('[validate-list] Validation completed:', {
        isValid: validation.isValid,
        confidence: validation.confidence,
        issuesCount: validation.issues.length
      });
    } catch (parseError) {
      console.error('[validate-list] Failed to parse Gemini response:', cleanText);
      throw new Error('Invalid AI response format');
    }

    return res.status(200).json(validation);

  } catch (error) {
    console.error('[validate-list] ERROR:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
