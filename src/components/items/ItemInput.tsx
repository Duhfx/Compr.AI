// src/components/items/ItemInput.tsx
// Release 3: Item input with intelligent autocomplete

import { useState, useRef, useEffect } from 'react';
import { useSuggestions } from '../../hooks/useSuggestions';
import { Loader2, Sparkles, History } from 'lucide-react';

interface ItemInputProps {
  onAddItem: (name: string, quantity: number, unit: string, category?: string) => void;
  placeholder?: string;
  className?: string;
}

export const ItemInput: React.FC<ItemInputProps> = ({
  onAddItem,
  placeholder = 'Adicionar item...',
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, loading, getSuggestions, clearSuggestions } = useSuggestions({
    minChars: 2,
    maxSuggestions: 5,
    debounceMs: 300
  });

  // Atualizar sugestões quando input mudar
  useEffect(() => {
    if (input.trim().length >= 2) {
      getSuggestions(input.trim());
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  }, [input, getSuggestions, clearSuggestions]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && input.trim()) {
        handleAddItem(input.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (input.trim()) {
          handleAddItem(input.trim());
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: typeof suggestions[0]) => {
    onAddItem(
      suggestion.name,
      suggestion.quantity,
      suggestion.unit,
      suggestion.category
    );
    setInput('');
    clearSuggestions();
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleAddItem = (name: string) => {
    onAddItem(name, 1, 'un');
    setInput('');
    clearSuggestions();
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck="true"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${index}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </span>
                    {suggestion.source === 'ai' ? (
                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    ) : (
                      <History className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {suggestion.category && (
                      <span className="text-xs text-gray-500">
                        {suggestion.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {suggestion.quantity} {suggestion.unit}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Dica de uso */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <History className="w-3 h-3" />
                Histórico
              </span>
              {' • '}
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sugestão de IA
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
