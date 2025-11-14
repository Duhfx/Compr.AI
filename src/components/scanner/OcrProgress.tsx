interface OcrProgressProps {
  progress: number;
  message: string;
}

/**
 * Componente de feedback visual para processamento OCR
 * 
 * Mostra:
 * - Barra de progresso animada
 * - Mensagem de status
 * - Spinner visual
 */
export const OcrProgress: React.FC<OcrProgressProps> = ({
  progress,
  message
}) => {
  return (
    <div className="space-y-6 py-8">
      {/* Ícone animado */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
        </div>
      </div>

      {/* Mensagem */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {message}
        </h3>
        <p className="text-sm text-gray-600">
          Isso pode levar alguns segundos...
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: progress + '%' }}
          />
        </div>
        <p className="text-center text-sm font-medium text-gray-700">
          {progress}%
        </p>
      </div>

      {/* Dicas enquanto espera */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> Para melhores resultados, tire fotos com boa iluminação e mantendo a nota fiscal reta.
        </p>
      </div>
    </div>
  );
};
