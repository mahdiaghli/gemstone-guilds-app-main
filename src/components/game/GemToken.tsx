import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GemType, GEM_INFO } from '@/lib/gameData';
import gemDiamondImg from '@/assets/gem-diamond.png';
import gemSapphireImg from '@/assets/gem-blue.png';
import gemEmeraldImg from '@/assets/gem-emerald.png';
import gemRubyImg from '@/assets/gem-red.png';
import gemOnyxImg from '@/assets/gem-onyx.png';
import gemGoldImg from '@/assets/gem-gold.png';

interface GemTokenProps {
  type: GemType | 'gold';
  count?: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  dataTokenPool?: string;
}

export const gemTokenImages: Record<GemType | 'gold', string> = {
  diamond: gemDiamondImg,
  sapphire: gemSapphireImg,
  emerald: gemEmeraldImg,
  ruby: gemRubyImg,
  onyx: gemOnyxImg,
  gold: gemGoldImg,
};

export default function GemToken({ type, count, onClick, selected, disabled, size = 'md', dataTokenPool }: GemTokenProps) {
  const info = GEM_INFO[type];
  const sizeClasses = {
    sm: 'h-8 gap-1 px-2 text-[10px]',
    md: 'h-10 gap-1.5 px-2.5 text-sm',
    lg: 'h-12 gap-2 px-3 text-base',
  };
  const imageClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.12 } : undefined}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'rounded-full flex items-center justify-center font-bold transition-all relative',
        sizeClasses[size],
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && onClick && 'cursor-pointer',
        `gem-glow-${type}`,
      )}
      style={{
        backgroundColor: info.bgColor,
        border: `2px solid ${info.color}`,
        color: '#fff',
      }}
      data-token-pool={dataTokenPool}
    >
      <img src={gemTokenImages[type]} alt={info.name} className={imageClasses[size]} />
      {count !== undefined && <span className="min-w-[0.75rem] text-center">{count}</span>}
    </motion.button>
  );
}
