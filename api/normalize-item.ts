// api/normalize-item.ts
// Release 3: Normalize product names for consistency

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface NormalizeRequest {
  rawName: string;
}

interface NormalizeResponse {
  normalized: string;
  category?: string;
  suggestedUnit?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rawName } = req.body as NormalizeRequest;

    // Validação básica
    if (!rawName || typeof rawName !== 'string') {
      return res.status(400).json({ error: 'rawName is required and must be a string' });
    }

    // Sanitizar input
    const sanitizedName = rawName.trim().substring(0, 200);
    if (!sanitizedName) {
      return res.status(400).json({ error: 'rawName cannot be empty' });
    }

    // Chamar Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
Normalize o nome do produto para uso em lista de compras.

**Produto original**: "${sanitizedName}"

**Regras de normalização**:
1. Primeira letra de cada palavra em maiúscula
2. Remover caracteres especiais desnecessários
3. Padronizar abreviações comuns (ex: "pct" → "pacote", "cx" → "caixa")
4. Manter unidades no formato correto (1L, 500ml, 2kg, etc.)
5. Remover marcas específicas se não forem essenciais
6. Manter descritores importantes (integral, desnatado, light, etc.)

**Exemplos**:
- "leite integral itambé" → "Leite Integral 1L"
- "ARROZ TIPO 1 5KG" → "Arroz Tipo 1 5kg"
- "pao frances" → "Pão Francês"
- "coca cola 2l" → "Refrigerante 2L"
- "sabao em po omo" → "Sabão em Pó"

**Retorne APENAS um JSON válido (sem markdown)**:
{
  "normalized": "Nome Normalizado",
  "category": "Categoria apropriada (Alimentos, Bebidas, Limpeza, Higiene, Outros)",
  "suggestedUnit": "un" ou "kg" ou "L" ou "g" ou "ml"
}
`.trim();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Remover markdown se houver
    const cleanText = responseText.replace(/```json|```/g, '').trim();

    let normalized: NormalizeResponse;
    try {
      normalized = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanText);
      // Fallback: retornar o nome com primeira letra maiúscula
      const fallbackName = sanitizedName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return res.status(200).json({
        normalized: fallbackName,
        category: 'Outros',
        suggestedUnit: 'un'
      });
    }

    // Validar estrutura da resposta
    if (!normalized.normalized || typeof normalized.normalized !== 'string') {
      throw new Error('Invalid response structure from AI');
    }

    return res.status(200).json(normalized);

  } catch (error) {
    console.error('Error in normalize-item:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
