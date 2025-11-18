// src/hooks/useButtonAnimation.ts
// Hook para adicionar animações sutis de sucesso em botões

import { useState, useCallback } from 'react';

interface UseButtonAnimationReturn {
  isAnimating: boolean;
  triggerAnimation: () => void;
  animationClass: string;
}

export const useButtonAnimation = (): UseButtonAnimationReturn => {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Duração da animação
  }, []);

  const animationClass = isAnimating
    ? 'animate-pulse scale-105 transition-transform duration-200'
    : '';

  return {
    isAnimating,
    triggerAnimation,
    animationClass,
  };
};
