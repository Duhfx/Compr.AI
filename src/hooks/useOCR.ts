import { useState } from 'react';
import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  source: 'local' | 'cloud';
}

export interface UseOcrReturn {
  extractText: (imageBase64: string) => Promise<OcrResult>;
  loading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook para extração de texto de imagens (OCR)
 * 
 * Estratégia:
 * 1. Tenta Tesseract.js local primeiro (offline)
 * 2. Se confiança < 70%, tenta Cloud Vision API (fallback)
 * 
 * @example
 * const { extractText, loading, progress } = useOCR();
 * const result = await extractText(imageBase64);
 */
export const useOCR = (): UseOcrReturn => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const extractText = async (imageBase64: string): Promise<OcrResult> => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('[OCR] Iniciando extração de texto...');

      // 1️⃣ Tentar Tesseract.js local primeiro
      console.log('[OCR] Tentando Tesseract.js local...');
      
      const result = await Tesseract.recognize(
        imageBase64,
        'por', // Português
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const currentProgress = Math.round(m.progress * 100);
              setProgress(currentProgress);
              console.log(`[OCR] Progresso: ${currentProgress}%`);
            }
          }
        }
      );

      const confidence = result.data.confidence;
      const extractedText = result.data.text;

      console.log(`[OCR] Tesseract concluído - Confiança: ${confidence}%`);
      console.log(`[OCR] Texto extraído (${extractedText.length} caracteres)`);

      // Se confiança >= 70%, usar resultado local
      if (confidence >= 70) {
        console.log('[OCR] ✅ Confiança suficiente, usando resultado local');
        setProgress(100);
        return {
          text: extractedText,
          confidence,
          source: 'local'
        };
      }

      // 2️⃣ Se confiança baixa, tentar Cloud Vision (se implementado)
      console.log(`[OCR] ⚠️ Confiança baixa (${confidence}%), tentando Cloud Vision...`);
      
      try {
        const cloudResponse = await fetch('/api/ocr-cloud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageBase64 })
        });

        if (cloudResponse.ok) {
          const cloudData = await cloudResponse.json();
          console.log('[OCR] ✅ Cloud Vision concluído');
          setProgress(100);
          
          return {
            text: cloudData.text,
            confidence: cloudData.confidence || 95,
            source: 'cloud'
          };
        } else {
          console.warn('[OCR] Cloud Vision falhou, usando resultado local');
        }
      } catch (cloudError) {
        console.warn('[OCR] Cloud Vision não disponível, usando resultado local:', cloudError);
      }

      // Fallback: usar resultado local mesmo com baixa confiança
      setProgress(100);
      return {
        text: extractedText,
        confidence,
        source: 'local'
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido no OCR';
      console.error('[OCR] ❌ Erro:', message);
      setError(message);
      throw new Error(`Falha ao extrair texto: ${message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return {
    extractText,
    loading,
    progress,
    error
  };
};
