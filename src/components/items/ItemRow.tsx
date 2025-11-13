import { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import type { ShoppingItem } from '../../hooks/useSupabaseItems';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export const ItemRow = ({ item, onToggle, onEdit, onDelete }: ItemRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const x = useMotionValue(0);
  const xSpring = useSpring(x, { damping: 20, stiffness: 300 });
  const deleteButtonOpacity = useTransform(xSpring, [-100, -50, 0], [1, 0.5, 0]);
  const deleteButtonScale = useTransform(xSpring, [-100, -50, 0], [1, 0.8, 0.5]);

  const bind = useDrag(
    ({ movement: [mx], last }) => {
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
        x.set(-80);
        setIsOpen(true);
      } else if (mx > -40 && isOpen) {
        // Swipe right: close delete button
        x.set(0);
        setIsOpen(false);
      } else if (isOpen) {
        // Snap back to open position
        x.set(-80);
      } else {
        // Snap back to closed position
        x.set(0);
      }
    },
    {
      axis: 'x',
      bounds: { left: -120, right: 0 },
      rubberband: true,
    }
  );

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleToggle = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onToggle(item.id);
  };

  return (
    <div className="relative bg-white overflow-hidden border-b border-gray-150">
      {/* Delete button background */}
      <motion.button
        onClick={handleDelete}
        style={{ opacity: deleteButtonOpacity, scale: deleteButtonScale }}
        className="absolute right-0 top-0 bottom-0 w-20 bg-error flex items-center justify-center active:bg-red-700 transition-colors"
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
        className="flex items-center gap-3 px-4 py-3 bg-white touch-pan-y"
      >
        {/* iOS-style checkbox */}
        <button
          onClick={handleToggle}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            item.checked
              ? 'bg-primary border-primary'
              : 'border-gray-300 bg-white'
          }`}
        >
          {item.checked && (
            <svg
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
            </svg>
          )}
        </button>

        <div onClick={() => onEdit(item)} className="flex-1 cursor-pointer min-w-0">
          <h4
            className={`text-[17px] truncate ${
              item.checked ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {item.name}
          </h4>
          <p className="text-[13px] text-gray-500">
            {item.quantity} {item.unit}
            {item.category && ` · ${item.category}`}
          </p>
        </div>

        {/* Info chevron */}
        <svg
          className="w-5 h-5 text-gray-300 flex-shrink-0"
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
      </motion.div>
    </div>
  );
};
