import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export default function Tutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'menu' | 'steps' | 'manual'>('menu');
  const { t, dir } = useLanguage();

  const steps = [
    { title: t('tut1Title'), icon: '🎯', content: t('tut1Content'), tip: t('tut1Tip') },
    { title: t('tut2Title'), icon: '💎', content: t('tut2Content'), tip: t('tut2Tip') },
    { title: t('tut3Title'), icon: '🃏', content: t('tut3Content'), tip: t('tut3Tip') },
    { title: t('tut4Title'), icon: '📌', content: t('tut4Content'), tip: t('tut4Tip') },
    { title: t('tut5Title'), icon: '👑', content: t('tut5Content'), tip: t('tut5Tip') },
  ];

  const manualSections = [
    { title: t('setupSection'), icon: '⚙️', content: t('setupContent') },
    { title: t('turnSection'), icon: '🎲', content: t('turnContent') },
    { title: t('cardTypesSection'), icon: '🎴', content: t('cardTypesContent') },
    { title: t('tokenRulesSection'), icon: '💰', content: t('tokenRulesContent') },
    { title: t('winConditionSection'), icon: '🏆', content: t('winConditionContent') },
    { title: t('strategySection'), icon: '🧠', content: t('strategyContent') },
  ];

  return (
    <div dir={dir} className="min-h-screen felt-surface flex flex-col items-center justify-center p-4">
      <motion.div className="w-full max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cinzel text-2xl text-primary tracking-widest">{t('tutorialTitle')}</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>✕</Button>
        </div>

        {mode === 'menu' ? (
          <div className="space-y-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setMode('steps'); setStep(0); }}
              className={cn('w-full p-5 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary/60 transition-all flex items-center gap-4', dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left')}>
              <span className="text-3xl">🎓</span>
              <div>
                <p className="font-cinzel text-primary tracking-wider">{t('stepByStep')}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{t('stepByStepDesc')}</p>
              </div>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setMode('manual'); setStep(0); }}
              className={cn('w-full p-5 rounded-xl border-2 border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60 transition-all flex items-center gap-4', dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left')}>
              <span className="text-3xl">📖</span>
              <div>
                <p className="font-cinzel text-orange-500 tracking-wider">{t('fullManual')}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{t('fullManualDesc')}</p>
              </div>
            </motion.button>

            <motion.a href="https://www.youtube.com/watch?v=DheGfd3JKEI" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={cn('w-full p-5 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:border-red-500/60 transition-all flex items-center gap-4', dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left')}>
              <span className="text-3xl">▶️</span>
              <div>
                <p className="font-cinzel text-red-500 tracking-wider">{t('youtubeTitle')}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{t('youtubeDesc')}</p>
              </div>
            </motion.a>

            <motion.a href="https://www.aparat.com/v/s740g92?refererRef=search" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={cn('w-full p-5 rounded-xl border-2 border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 transition-all flex items-center gap-4', dir === 'rtl' ? 'text-right flex-row-reverse' : 'text-left')}>
              <span className="text-3xl">🎬</span>
              <div>
                <p className="font-cinzel text-purple-500 tracking-wider">{t('aparatTitle')}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{t('aparatDesc')}</p>
              </div>
            </motion.a>
          </div>
        ) : (
          <div>
            <div className="flex gap-1.5 justify-center mb-6 overflow-x-auto pb-2">
              {(mode === 'steps' ? steps : manualSections).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn('h-2 rounded-full transition-all', i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-border')}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: dir === 'rtl' ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
                className={cn('bg-card border border-border rounded-xl p-6', dir === 'rtl' ? 'text-right' : 'text-left')}>
                <div className="text-4xl mb-4 text-center">{(mode === 'steps' ? steps : manualSections)[step].icon}</div>
                <h2 className="font-cinzel text-xl text-primary tracking-wider mb-4 text-center">{(mode === 'steps' ? steps : manualSections)[step].title}</h2>
                <p className="text-foreground font-body text-base leading-relaxed mb-4 whitespace-pre-line">{(mode === 'steps' ? steps : manualSections)[step].content}</p>
                {mode === 'steps' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground font-body">💡 {steps[step].tip}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : setMode('menu')} className="flex-1">
                {step > 0 ? t('prev') : t('back')}
              </Button>
              <Button variant="game" onClick={() => step < (mode === 'steps' ? steps : manualSections).length - 1 ? setStep(step + 1) : navigate('/')} className="flex-1">
                {step < (mode === 'steps' ? steps : manualSections).length - 1 ? t('next') : t('startPlaying')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
