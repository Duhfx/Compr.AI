// src/pages/Scanner.tsx
// Página nativa para escanear nota fiscal (substitui o modal)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { ImageCapture } from '../components/scanner/ImageCapture';
import { OcrProgress } from '../components/scanner/OcrProgress';
import { ReceiptPreview } from '../components/scanner/ReceiptPreview';
import { useOCR } from '../hooks/useOCR';
import { useReceiptProcessing } from '../hooks/useReceiptProcessing';
import type { ProcessedReceipt } from '../hooks/useReceiptProcessing';
import { ErrorMessage } from '../components/ui/ErrorMessage';

type ScannerStep = 'capture' | 'processing' | 'preview';

export const Scanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<ScannerStep>('capture');
  const [processedData, setProcessedData] = useState<ProcessedReceipt | null>(null);
  const [currentMessage, setCurrentMessage] = useState('Iniciando...');
  const [error, setError] = useState<string | null>(null);

  const { extractText, loading: ocrLoading, progress } = useOCR();
  const { processReceipt } = useReceiptProcessing();

  const handleImageCapture = async (imageBase64: string) => {
    setStep('processing');
    setError(null);

    try {
      // Etapa 1: OCR - Extrair texto da imagem
      setCurrentMessage('Extraindo texto da nota fiscal...');
      const ocrResult = await extractText(imageBase64);
      console.log('[Scanner] OCR concluído:', ocrResult);

      // Etapa 2: Gemini - Estruturar dados
      setCurrentMessage('Analisando produtos e preços...');
      const structured = await processReceipt(ocrResult.text, user?.id || '');
      console.log('[Scanner] Estruturação concluída:', structured);

      // Sucesso - Mostrar preview
      setProcessedData(structured);
      setStep('preview');

    } catch (error) {
      console.error('[Scanner] Erro no processamento:', error);

      setError('Não foi possível processar a nota fiscal. Tente novamente.');
      setStep('capture');
    }
  };

  const handleSuccess = () => {
    setProcessedData(null);
    navigate('/history');
  };

  const handleReset = () => {
    setProcessedData(null);
    setStep('capture');
  };

  return (
    <Layout>
      <div className="px-4 py-4 pb-28">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-gray-900 dark:text-white mb-2">
            Escanear Nota
          </h1>
          <p className="text-[17px] text-gray-500 dark:text-gray-400">
            Capture uma foto da nota fiscal para registrar os preços
          </p>
        </div>

        {/* Error Message */}
        <ErrorMessage message={error} className="mb-4" />

        {/* Content */}
        {step === 'capture' && (
          <ImageCapture onCapture={handleImageCapture} />
        )}

        {step === 'processing' && (
          <OcrProgress
            progress={ocrLoading ? progress : 100}
            message={currentMessage}
          />
        )}

        {step === 'preview' && processedData && (
          <ReceiptPreview
            data={processedData}
            userId={user?.id || ''}
            onSuccess={handleSuccess}
            onCancel={handleReset}
          />
        )}
      </div>
    </Layout>
  );
};
