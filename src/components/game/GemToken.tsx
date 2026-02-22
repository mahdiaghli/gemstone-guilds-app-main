import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GemType, GEM_INFO } from '@/lib/gameData';

interface GemTokenProps {
  type: GemType | 'gold';
  count?: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function GemToken({ type, count, onClick, selected, disabled, size = 'md' }: GemTokenProps) {
  const info = GEM_INFO[type];
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.12 } : undefined}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'rounded-full flex flex-col items-center justify-center font-bold transition-all relative',
        sizeClasses[size],
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && onClick && 'cursor-pointer',
        `gem-glow-${type}`,
      )}
      style={{
        backgroundColor: info.bgColor,
        border: `2px solid ${info.color}`,
        color: info.color,
      }}
    >
      {count !== undefined && <span>{count}</span>}
    </motion.button>
  );
}
