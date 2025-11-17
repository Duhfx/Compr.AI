import { useRef, useState } from 'react';
import { compressImage, blobToBase64, isValidImage, formatFileSize } from '../../lib/imageUtils';

interface ImageCaptureProps {
  onCapture: (imageBase64: string) => void;
}

/**
 * Componente para captura de imagem de nota fiscal
 *
 * Permite:
 * - Tirar foto via câmera (mobile)
 * - Upload de arquivo (desktop)
 * - Preview antes de processar
 * - Compressão automática
 */
export const ImageCapture: React.FC<ImageCaptureProps> = ({
  onCapture
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    if (!isValidImage(file)) {
      alert('Arquivo inválido. Use imagens JPEG, PNG ou WebP com até 10MB.');
      return;
    }

    setLoading(true);

    try {
      console.log('[ImageCapture] Comprimindo imagem...');
      console.log('[ImageCapture] Tamanho original:', formatFileSize(file.size));

      // Comprimir imagem (max 1024px, qualidade 0.8)
      const compressed = await compressImage(file, 1024, 0.8);
      console.log('[ImageCapture] Tamanho comprimido:', formatFileSize(compressed.size));

      // Converter para base64
      const base64 = await blobToBase64(compressed);
      
      setPreview(base64);
      setFileInfo({
        name: file.name,
        size: formatFileSize(compressed.size)
      });
    } catch (error) {
      console.error('[ImageCapture] Erro ao processar imagem:', error);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onCapture(preview);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-primary text-white py-4 px-6 rounded-ios font-semibold text-[17px] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? 'Processando imagem...' : 'Capturar ou Selecionar Imagem'}
          </button>

          <p className="text-[15px] text-gray-500 dark:text-gray-400 text-center">
            Tire uma foto ou selecione uma imagem da galeria
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview da imagem */}
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <img
              src={preview}
              alt="Preview da nota fiscal"
              className="w-full h-auto"
            />
          </div>

          {/* Info do arquivo */}
          {fileInfo && (
            <div className="text-[13px] text-gray-500 dark:text-gray-400 text-center space-y-1">
              <p className="font-medium">{fileInfo.name}</p>
              <p>{fileInfo.size}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-ios font-semibold text-[17px] hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
            >
              Selecionar Outra
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-ios font-semibold text-[17px] hover:bg-opacity-90 transition-all active:scale-95"
            >
              Processar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
