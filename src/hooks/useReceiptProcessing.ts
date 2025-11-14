import { useState } from 'react';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface ProcessedReceipt {
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
}

export interface UseReceiptProcessingReturn {
  processReceipt: (ocrText: string, userId: string) => Promise<ProcessedReceipt>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para processar texto OCR de nota fiscal usando Gemini AI
 * 
 * Envia o texto bruto para a API que usa Gemini para estruturar
 * os dados em formato JSON (loja, data, itens, preços)
 * 
 * @example
 * const { processReceipt, loading } = useReceiptProcessing();
 * const receipt = await processReceipt(ocrText, userId);
 */
export const useReceiptProcessing = (): UseReceiptProcessingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processReceipt = async (
    ocrText: string,
    userId: string
  ): Promise<ProcessedReceipt> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ReceiptProcessing] Enviando texto OCR para API...');
      console.log(`[ReceiptProcessing] Tamanho do texto: ${ocrText.length} caracteres`);

      const response = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText, userId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Erro na API: ${response.status} ${response.statusText}`
        );
      }

      const data: ProcessedReceipt = await response.json();

      // Validação básica
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Formato inválido retornado pela API');
      }

      if (data.items.length === 0) {
        throw new Error('Nenhum item foi identificado na nota fiscal');
      }

      console.log(`[ReceiptProcessing] Sucesso! ${data.items.length} itens processados`);
      console.log(`[ReceiptProcessing] Loja: ${data.store}`);
      console.log(`[ReceiptProcessing] Data: ${data.date}`);
      console.log('[ReceiptProcessing] Total: R$', data.total.toFixed(2));

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[ReceiptProcessing] Erro:', message);
      setError(message);
      throw new Error(`Falha ao processar nota fiscal: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    processReceipt,
    loading,
    error
  };
};
