// src/pages/Scanner.tsx
// Página nativa para escanear nota fiscal (substitui o modal)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ImageCapture } from '../components/scanner/ImageCapture';
import { OcrProgress } from '../components/scanner/OcrProgress';
import { ReceiptPreview } from '../components/scanner/ReceiptPreview';
import { BottomTabBar } from '../components/layout/BottomTabBar';
import { useOCR } from '../hooks/useOCR';
import { useReceiptProcessing } from '../hooks/useReceiptProcessing';
import type { ProcessedReceipt } from '../hooks/useReceiptProcessing';
import toast, { Toaster } from 'react-hot-toast';

type ScannerStep = 'capture' | 'processing' | 'preview';

export const Scanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<ScannerStep>('capture');
  const [processedData, setProcessedData] = useState<ProcessedReceipt | null>(null);
  const [currentMessage, setCurrentMessage] = useState('Iniciando...');

  const { extractText, loading: ocrLoading, progress } = useOCR();
  const { processReceipt } = useReceiptProcessing();

  const handleImageCapture = async (imageBase64: string) => {
    setStep('processing');

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

      toast.error('Não foi possível processar a nota fiscal. Tente novamente.');
      setStep('capture');
    }
  };

  const handleSuccess = () => {
    setProcessedData(null);
    toast.success('✅ Histórico atualizado!');
    navigate('/history');
  };

  const handleCancel = () => {
    setProcessedData(null);
    setStep('capture');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-sm mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-[20px] font-semibold text-gray-900 dark:text-white">
              Escanear Nota Fiscal
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-sm mx-auto px-4 py-6 pb-28">
        {step === 'capture' && (
          <ImageCapture
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
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
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};
