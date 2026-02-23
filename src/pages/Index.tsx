import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import heroImage from '@/assets/hero-gems.jpg';
import { AIDifficulty } from '@/lib/aiPlayer';

type GameMode = 'ai' | 'local' | 'online' | null;

const GEM_DECORATIONS = [
  { emoji: '💎', x: '15%', y: '20%', delay: 0 },
  { emoji: '🔴', x: '80%', y: '15%', delay: 0.5 },
  { emoji: '🟢', x: '10%', y: '70%', delay: 1 },
  { emoji: '🔵', x: '85%', y: '65%', delay: 1.5 },
  { emoji: '⚫', x: '50%', y: '10%', delay: 2 },
];

export default function Index() {
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [players, setPlayers] = useState(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const menuItems = [
    { id: 'ai' as const, icon: '🤖', title: t('playWithAI'), subtitle: t('playWithAIDesc') },
    { id: 'local' as const, icon: '👥', title: t('localPlay'), subtitle: t('localPlayDesc') },
    { id: 'online' as const, icon: '🌐', title: t('onlinePlay'), subtitle: t('onlinePlayDesc') },
  ];

  const difficultyOptions: { id: AIDifficulty; label: string; emoji: string; desc: string }[] = [
    { id: 'easy', label: t('easy'), emoji: '🌱', desc: t('easyDesc') || 'ربات ساده و تصادفی' },
    { id: 'medium', label: t('medium'), emoji: '⚔️', desc: t('mediumDesc') || 'متعادل و منطقی' },
    { id: 'hard', label: t('hard'), emoji: '👑', desc: t('hardDesc') || 'ربات هوشمند و استراتژی' },
  ];

  const handleStart = () => {
    if (selectedMode === 'ai') navigate(`/game?players=${players}&mode=ai&difficulty=${difficulty}`);
    else if (selectedMode === 'local') navigate(`/game?players=${players}&mode=local`);
    else if (selectedMode === 'online') navigate('/online-lobby');
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />

      {GEM_DECORATIONS.map((gem, i) => (
        <motion.span key={i} className="absolute text-2xl md:text-3xl opacity-20 pointer-events-none" style={{ left: gem.x, top: gem.y }} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: gem.delay, ease: 'easeInOut' }}>
          {gem.emoji}
        </motion.span>
      ))}

      <motion.div className="relative z-10 text-center px-4 w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <motion.h1 className="font-cinzel text-5xl md:text-7xl text-primary tracking-[0.25em] mb-2" initial={{ letterSpacing: '0.5em', opacity: 0 }} animate={{ letterSpacing: '0.25em', opacity: 1 }} transition={{ duration: 1.2 }}>
          SPLENDOR
        </motion.h1>
        <motion.div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-3" initial={{ width: 0 }} animate={{ width: 96 }} transition={{ duration: 0.8, delay: 0.5 }} />
        <motion.p className="text-muted-foreground text-sm md:text-base font-body tracking-wider mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {t('subtitle')}
        </motion.p>

        <motion.div className="space-y-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {menuItems.map((item, i) => (
            <motion.button key={item.id} initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedMode(selectedMode === item.id ? null : item.id)}
              className={cn('w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all', dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left', selectedMode === item.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-border/50 bg-card/50 hover:border-primary/30')}>
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className={cn('font-cinzel text-sm tracking-wider', selectedMode === item.id ? 'text-primary' : 'text-foreground')}>{item.title}</p>
                <p className="text-xs text-muted-foreground font-body">{item.subtitle}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence>
          {(selectedMode === 'ai' || selectedMode === 'local') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest mb-3">{t('playerCount')}</p>
              <div className="flex gap-3 justify-center mb-4">
                {[2, 3, 4].map(n => (
                  <motion.button key={n} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setPlayers(n)}
                    className={cn('w-12 h-12 rounded-xl border-2 font-cinzel text-lg transition-all', players === n ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20' : 'border-border text-muted-foreground hover:border-primary/40')}>
                    {n}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMode === 'ai' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest mb-3">{t('difficulty')}</p>
              <div className="space-y-2">
                {difficultyOptions.map(opt => (
                  <motion.button key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDifficulty(opt.id)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all', dir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left',
                      difficulty === opt.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-border/50 bg-card/50 hover:border-primary/30')}>
                    <span className="text-xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className={cn('font-cinzel text-sm tracking-wider', difficulty === opt.id ? 'text-primary' : 'text-foreground')}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button variant="hero" onClick={handleStart} className="w-full mb-4">
                {selectedMode === 'online' ? t('enterLobby') : t('startGame')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <Button variant="ghost" onClick={() => navigate('/tutorial')} className="text-muted-foreground hover:text-primary">
            {t('tutorial')}
          </Button>
        </motion.div>
      </motion.div>

      <motion.p className="absolute bottom-6 text-[11px] text-muted-foreground/40 font-body tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        {t('attribution')}
      </motion.p>
    </div>
  );
}
