import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import type { ShoppingItem } from '../../hooks/useSupabaseItems';

interface ItemModalProps {
  isOpen: boolean;
  item?: ShoppingItem;
  onClose: () => void;
  onSave: (data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }) => void;
}

const UNITS = ['un', 'kg', 'g', 'L', 'ml'];
const CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Laticínios',
  'Limpeza',
  'Higiene',
  'Padaria',
  'Açougue',
  'Hortifruti',
  'Outros'
];

export const ItemModal = ({ isOpen, item, onClose, onSave }: ItemModalProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('un');
  const [category, setCategory] = useState('');
  const [y, setY] = useState(0);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setCategory(item.category || '');
    } else {
      setName('');
      setQuantity(1);
      setUnit('un');
      setCategory('');
    }
  }, [item, isOpen]);

  const bind = useDrag(
    ({ movement: [, my], last }) => {
      // Only allow drag down
      if (my < 0) {
        setY(0);
        return;
      }

      setY(my);

      // Close if dragged far enough
      if (last && my > 100) {
        onClose();
        setY(0);
      } else if (last) {
        setY(0);
      }
    },
    {
      axis: 'y',
      bounds: { top: 0 },
      rubberband: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      quantity,
      unit,
      category: category || undefined
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Ocupa a tela toda */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-40 z-[999]"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: y }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-[20px] z-[1000] max-w-screen-sm mx-auto shadow-ios-lg safe-bottom"
          >
            {/* Handle */}
            <div {...bind()} className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            <div className="px-4 pb-6">
              <h2 className="text-[20px] font-semibold text-center mb-6 dark:text-white">
                {item ? 'Editar Item' : 'Adicionar Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1 ml-3">
                    Nome do Produto
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-ios text-[17px] focus:outline-none focus:bg-gray-150 dark:focus:bg-gray-600 transition-colors"
                    placeholder="Ex: Arroz integral"
                    required
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="sentences"
                    spellCheck="false"
                    enterKeyHint="next"
                  />
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="quantity" className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1 ml-3">
                      Quantidade
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-ios text-[17px] focus:outline-none focus:bg-gray-150 dark:focus:bg-gray-600 transition-colors"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="unit" className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1 ml-3">
                      Unidade
                    </label>
                    <select
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-ios text-[17px] focus:outline-none focus:bg-gray-150 dark:focus:bg-gray-600 transition-colors"
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1 ml-3">
                    Categoria
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-ios text-[17px] focus:outline-none focus:bg-gray-150 dark:focus:bg-gray-600 transition-colors"
                  >
                    <option value="">Nenhuma</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-ios text-[17px] font-semibold text-primary border-2 border-primary hover:bg-primary hover:bg-opacity-5 dark:hover:bg-opacity-10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-white rounded-ios text-[17px] font-semibold hover:bg-opacity-90 transition-colors"
                  >
                    {item ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
