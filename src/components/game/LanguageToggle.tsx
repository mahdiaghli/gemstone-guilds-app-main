import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
      className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm text-sm font-bold text-foreground hover:border-primary/40 transition-all"
    >
      {lang === 'fa' ? 'EN' : 'فا'}
    </motion.button>
  );
}
