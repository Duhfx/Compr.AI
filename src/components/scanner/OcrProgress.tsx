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
        <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
      </div>

      {/* Mensagem */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {message}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Isso pode levar alguns segundos...
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: progress + '%' }}
          />
        </div>
        <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {progress}%
        </p>
      </div>

      {/* Dicas enquanto espera */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Dica:</strong> Para melhores resultados, tire fotos com boa iluminação e mantendo a nota fiscal reta.
        </p>
      </div>
    </div>
  );
};
