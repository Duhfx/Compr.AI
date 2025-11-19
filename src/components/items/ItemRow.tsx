import { useState, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import type { ShoppingItem } from '../../hooks/useSupabaseItems';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export const ItemRow = ({ item, onToggle, onEdit, onDelete }: ItemRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visualChecked, setVisualChecked] = useState(item.checked);
  const isDragging = useRef(false);
  const x = useMotionValue(0);
  const xSpring = useSpring(x, { damping: 20, stiffness: 300 });

  // Sync visual state when item changes externally (but not during animation)
  useEffect(() => {
    if (!isAnimating) {
      setVisualChecked(item.checked);
    }
  }, [item.checked, isAnimating]);

  const bind = useDrag(
    ({ movement: [mx], last }) => {
      // Mark as dragging
      if (!last) {
        isDragging.current = true;
      }

      // During drag, follow finger
      if (!last) {
        // Only allow swipe to left when closed
        if (mx > 0 && !isOpen) {
          x.set(0);
          return;
        }
        // Allow swipe to right when open (to close)
        if (isOpen && mx > -80) {
          x.set(Math.max(mx, -80));
          return;
        }
        x.set(Math.max(mx, -120));
        return;
      }

      // On release
      if (mx < -50 && !isOpen) {
        // Swipe left: open delete button
        console.log('[ItemRow] Opening delete button');
        x.set(-80);
        setIsOpen(true);
      } else if (mx > -40 && isOpen) {
        // Swipe right: close delete button
        console.log('[ItemRow] Closing delete button');
        x.set(0);
        setIsOpen(false);
      } else if (isOpen) {
        // Snap back to open position
        x.set(-80);
      } else {
        // Snap back to closed position
        x.set(0);
      }

      // Reset dragging flag after a short delay
      setTimeout(() => {
        isDragging.current = false;
      }, 100);
    },
    {
      axis: 'x',
      bounds: { left: -120, right: 0 },
      rubberband: true,
    }
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ItemRow] Delete button clicked, deleting item:', item.name);
    onDelete(item.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragging.current) {
      console.log('[ItemRow] Ignoring toggle during drag');
      return;
    }

    if (isAnimating) {
      console.log('[ItemRow] Ignoring toggle during animation');
      return;
    }

    console.log('[ItemRow] Toggling item:', item.name);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Trigger animation
    setIsAnimating(true);

    // Immediately update visual state for animation
    const newCheckedState = !item.checked;
    setVisualChecked(newCheckedState);

    // Call onToggle immediately to start section transition
    onToggle(item.id);

    // Keep animation flag for longer to prevent visual state reset
    setTimeout(() => {
      setIsAnimating(false);
    }, 800); // Increased to cover both checkbox animation + section transition
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragging.current) {
      console.log('[ItemRow] Ignoring edit during drag');
      return;
    }

    if (isOpen) {
      console.log('[ItemRow] Ignoring edit while delete button is open');
      return;
    }

    console.log('[ItemRow] Opening edit modal for:', item.name);
    onEdit(item);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDragging.current) {
      console.log('[ItemRow] Ignoring chevron during drag');
      return;
    }

    if (isOpen) {
      // If already open, close it
      console.log('[ItemRow] Closing delete button via chevron');
      x.set(0);
      setIsOpen(false);
    } else {
      // If closed, open delete button
      console.log('[ItemRow] Opening delete button via chevron');
      x.set(-80);
      setIsOpen(true);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 overflow-hidden border-b border-gray-150 dark:border-gray-700">
      {/* Delete button background */}
      <motion.button
        onClick={handleDelete}
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        className="absolute right-0 top-0 bottom-0 w-20 bg-error flex items-center justify-center active:bg-red-700 transition-opacity"
        tabIndex={isOpen ? 0 : -1}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </motion.button>

      {/* Swipeable content */}
      <motion.div
        {...(bind() as any)}
        style={{ x: xSpring }}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 touch-pan-y"
      >
        {/* iOS-style checkbox - Maior área de toque */}
        <button
          onClick={handleToggle}
          className="w-11 h-11 -ml-2.5 flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors"
        >
          <motion.div
            animate={{
              scale: isAnimating ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              visualChecked
                ? 'bg-primary border-primary'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
            }`}
          >
            <AnimatePresence mode="wait">
              {visualChecked && (
                <motion.svg
                  key="checkmark"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
        </button>

        <div onClick={handleEdit} className="flex-1 cursor-pointer min-w-0">
          <h4
            className={`text-[17px] truncate ${
              item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            }`}
          >
            {item.name}
          </h4>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            {item.quantity} {item.unit}
            {item.category && ` · ${item.category}`}
            {item.checked && item.checkedByUserNickname && ` · comprado por ${item.checkedByUserNickname}`}
          </p>
        </div>

        {/* Info chevron */}
        <button
          onClick={handleChevronClick}
          className="p-1 -mr-1 active:opacity-50 transition-opacity"
          aria-label={isOpen ? "Fechar" : "Abrir opções"}
        >
          <svg
            className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};
