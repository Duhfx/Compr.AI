// src/components/ui/ErrorMessage.tsx
// Componente reutilizável para exibir mensagens de erro inline

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string | null;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 text-red-500 text-sm mt-2 ${className}`}>
      <AlertCircle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
