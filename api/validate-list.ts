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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `
Você é um validador de listas de compras. Analise se os itens sugeridos fazem sentido para a solicitação original.

**Solicitação Original**: "${originalPrompt}"

**Itens Sugeridos**:
${suggestedItems.map((item, i) => `${i + 1}. ${item.name} (${item.quantity} ${item.unit}, ${item.category || 'Sem categoria'})`).join('\n')}

**Tarefa**: Avaliar se CADA item faz sentido para a solicitação. Considere:
1. O item é relevante para o contexto da solicitação?
2. A quantidade é adequada?
3. O item é realmente um produto de supermercado/compras?
4. Há itens importantes faltando?
5. Há itens duplicados ou muito similares?

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
      "reason": "Item relevante e quantidade apropriada"
    }
  ]
}

**Critérios de validação**:
- shouldKeep: true = item adequado para a lista
- shouldKeep: false = item não faz sentido para a solicitação
- confidence: 0-100 (quão confiante você está na lista como um todo)
- isValid: true se >80% dos itens são válidos, false caso contrário
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
