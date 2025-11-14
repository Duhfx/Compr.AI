import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

interface ProcessedReceipt {
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
}

/**
 * Vercel Function: Processar nota fiscal com Gemini AI
 * 
 * Recebe texto OCR e estrutura em JSON com:
 * - Loja
 * - Data
 * - Itens (nome, quantidade, preço unitário, total, categoria)
 * - Total geral
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ocrText, userId } = req.body;

    // Validar inputs
    if (!ocrText || typeof ocrText !== 'string') {
      return res.status(400).json({ 
        error: 'Campo ocrText é obrigatório e deve ser string' 
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        error: 'Campo userId é obrigatório' 
      });
    }

    console.log('[API] Processando nota fiscal...');
    console.log('[API] Tamanho do texto OCR:', ocrText.length, 'caracteres');
    console.log('[API] User ID:', userId);

    // Validar API key do Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.error('[API] GEMINI_API_KEY não configurada');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta',
        message: 'GEMINI_API_KEY não encontrada'
      });
    }

    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Prompt estruturado para Gemini
    const prompt = `
Analise o seguinte texto extraído de uma nota fiscal brasileira e estruture os dados em formato JSON.

TEXTO DA NOTA FISCAL:
---
${ocrText}
---

IMPORTANTE:
1. Identifique o nome da loja/estabelecimento (se não encontrar, use "Loja não identificada")
2. Extraia a data da compra no formato YYYY-MM-DD (se não encontrar, use a data de hoje)
3. Liste TODOS os produtos encontrados com:
   - Nome do produto (normalizado, sem códigos internos)
   - Quantidade (padrão 1 se não especificado)
   - Preço unitário em reais
   - Preço total (quantidade × preço unitário)
   - Categoria apropriada: Alimentos, Bebidas, Laticínios, Limpeza, Higiene, Padaria, Hortifruti, Açougue, Congelados, Outros
4. Calcule o total geral (soma de todos os itens)

REGRAS:
- Ignore linhas de cabeçalho, rodapé, dados do estabelecimento, formas de pagamento
- Ignore códigos de barras, NCM, CFOP
- Se um item aparecer múltiplas vezes, agrupe em um único registro
- Valores devem ser números decimais (ex: 5.99, não "5,99" ou "R$ 5,99")

FORMATO DE RESPOSTA (APENAS JSON VÁLIDO, SEM MARKDOWN):
{
  "store": "Nome do Mercado",
  "date": "2024-01-15",
  "items": [
    {
      "name": "Leite Integral 1L",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalPrice": 11.98,
      "category": "Laticínios"
    },
    {
      "name": "Arroz Tipo 1 5kg",
      "quantity": 1,
      "unitPrice": 25.90,
      "totalPrice": 25.90,
      "category": "Alimentos"
    }
  ],
  "total": 37.88
}

Retorne APENAS o JSON, sem explicações ou formatação markdown.
`;

    // Chamar Gemini
    console.log('[API] Enviando para Gemini...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('[API] Resposta do Gemini recebida');
    console.log('[API] Tamanho da resposta:', text.length, 'caracteres');

    // Limpar markdown se presente
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Parse JSON
    let structured: ProcessedReceipt;
    try {
      structured = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('[API] Erro ao parsear JSON:', parseError);
      console.error('[API] Texto recebido:', cleanText.substring(0, 500));
      return res.status(500).json({
        error: 'Erro ao processar resposta da IA',
        message: 'Formato inválido retornado pelo Gemini',
        debug: cleanText.substring(0, 200)
      });
    }

    // Validação básica do resultado
    if (!structured.items || !Array.isArray(structured.items)) {
      return res.status(500).json({
        error: 'Formato inválido',
        message: 'Campo items não encontrado ou inválido'
      });
    }

    if (structured.items.length === 0) {
      return res.status(400).json({
        error: 'Nenhum item identificado',
        message: 'Não foi possível identificar produtos na nota fiscal'
      });
    }

    // Validar campos obrigatórios de cada item
    const validItems = structured.items.filter(item => 
      item.name && 
      typeof item.quantity === 'number' && 
      typeof item.unitPrice === 'number'
    );

    if (validItems.length === 0) {
      return res.status(400).json({
        error: 'Itens inválidos',
        message: 'Nenhum item com dados válidos foi encontrado'
      });
    }

    structured.items = validItems;

    // Recalcular total
    structured.total = structured.items.reduce((sum, item) => sum + item.totalPrice, 0);

    console.log('[API] Sucesso!', validItems.length, 'itens processados');
    console.log('[API] Loja:', structured.store);
    console.log('[API] Data:', structured.date);
    console.log('[API] Total:', structured.total);

    return res.status(200).json(structured);

  } catch (error) {
    console.error('[API] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      error: 'Falha ao processar nota fiscal',
      message: errorMessage
    });
  }
}
