import { useState } from 'react';
import { ImageCapture } from './ImageCapture';
import { OcrProgress } from './OcrProgress';
import { ReceiptPreview } from './ReceiptPreview';
import { useOCR } from '../../hooks/useOCR';
import { useReceiptProcessing } from '../../hooks/useReceiptProcessing';
import type { ProcessedReceipt } from '../../hooks/useReceiptProcessing';

interface ReceiptScannerProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type ScannerStep = 'capture' | 'processing' | 'preview';

/**
 * Componente principal do fluxo de escaneamento de nota fiscal
 * 
 * Gerencia 3 etapas:
 * 1. Captura: ImageCapture (tirar foto/upload)
 * 2. Processamento: OcrProgress (OCR + Gemini)
 * 3. Preview: ReceiptPreview (editar e salvar)
 */
export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
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
      console.log('[ReceiptScanner] OCR concluído:', ocrResult);

      // Etapa 2: Gemini - Estruturar dados
      setCurrentMessage('Analisando produtos e preços...');
      const structured = await processReceipt(ocrResult.text, userId);
      console.log('[ReceiptScanner] Estruturação concluída:', structured);

      // Sucesso - Mostrar preview
      setProcessedData(structured);
      setStep('preview');

    } catch (error) {
      console.error('[ReceiptScanner] Erro no processamento:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro desconhecido';

      alert('Não foi possível processar a nota fiscal.\n\n' + errorMessage + '\n\nTente novamente.');
      setStep('capture');
    }
  };

  const handleSuccess = () => {
    setProcessedData(null);
    onSuccess();
  };

  const handleCancel = () => {
    setProcessedData(null);
    setStep('capture');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
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
            userId={userId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};
