import { useRef, useState } from 'react';
import { compressImage, blobToBase64, isValidImage, formatFileSize } from '../../lib/imageUtils';

interface ImageCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
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
  onCapture,
  onCancel
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
      alert('❌ Arquivo inválido. Use imagens JPEG, PNG ou WebP com até 10MB.');
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
      alert('❌ Erro ao processar imagem. Tente novamente.');
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
      <h2 className="text-xl font-bold text-gray-900">📸 Escanear Nota Fiscal</h2>

      {!preview ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment" // Abre câmera traseira no mobile
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processando...
              </>
            ) : (
              <>
                <span>📷</span>
                Tirar Foto / Fazer Upload
              </>
            )}
          </button>

          <p className="text-sm text-gray-600 text-center">
            Tire uma foto clara da nota fiscal ou selecione uma imagem da galeria
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview da imagem */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Preview da nota fiscal" 
              className="w-full h-auto"
            />
          </div>

          {/* Info do arquivo */}
          {fileInfo && (
            <div className="text-sm text-gray-600 text-center">
              <p>{fileInfo.name}</p>
              <p>{fileInfo.size}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              🔄 Refazer
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              ✅ Processar
            </button>
          </div>
        </div>
      )}

      {/* Botão cancelar */}
      <button
        onClick={onCancel}
        className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
};
