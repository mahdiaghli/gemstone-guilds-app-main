import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Lang = 'fa' | 'en';

const translations = {
  // Index page
  subtitle: { fa: 'تجارت جواهرات در دوران رنسانس', en: 'Gem Trading in the Renaissance' },
  playWithAI: { fa: 'بازی با ربات', en: 'Play vs AI' },
  playWithAIDesc: { fa: 'بازی هوشمند با AI', en: 'Challenge the computer' },
  localPlay: { fa: 'بازی محلی', en: 'Local Play' },
  localPlayDesc: { fa: 'بازی با دوستان روی یک دستگاه', en: 'Play with friends on one device' },
  onlinePlay: { fa: 'بازی آنلاین', en: 'Online Play' },
  onlinePlayDesc: { fa: 'بازی با بازیکنان سراسر جهان', en: 'Play with players worldwide' },
  playerCount: { fa: 'تعداد بازیکنان', en: 'PLAYERS' },
  difficulty: { fa: 'سطح سختی', en: 'DIFFICULTY' },
  easy: { fa: 'آسان', en: 'Easy' },
  easyDesc: { fa: 'ربات تصادفی و ساده', en: 'Simple random bot' },
  medium: { fa: 'متوسط', en: 'Medium' },
  mediumDesc: { fa: 'ربات منطقی و متعادل', en: 'Smart and balanced bot' },
  hard: { fa: 'سخت', en: 'Hard' },
  hardDesc: { fa: 'ربات استراتژیک و قوی', en: 'Strategic and powerful bot' },
  startGame: { fa: '🎮 شروع بازی', en: '🎮 Start Game' },
  enterLobby: { fa: '🌐 ورود به لابی', en: '🌐 Enter Lobby' },
  tutorial: { fa: '📖 آموزش بازی', en: '📖 How to Play' },
  attribution: { fa: 'الهام گرفته از بازی رومیزی مارک آندره', en: 'Inspired by the board game by Marc André' },

  // Game page
  player: { fa: 'بازیکن', en: 'Player' },
  aiThinking: { fa: '🤖 ربات در حال فکر...', en: '🤖 AI is thinking...' },
  reserved: { fa: 'رزرو شده', en: 'Reserved' },
  tooManyTokens: { fa: 'توکن‌های اضافی! برای برگرداندن کلیک کنید', en: 'Too many tokens! Click to return' },
  nobles: { fa: 'شاهزاده‌ها', en: 'Nobles' },
  take: { fa: 'برداشتن', en: 'Take' },
  takeSame: { fa: 'برداشتن ۲ یکسان', en: 'Take 2 Same' },
  cancel: { fa: 'انصراف', en: 'Cancel' },
  purchase: { fa: 'خرید', en: 'Purchase' },
  reserve: { fa: 'رزرو (+🌟)', en: 'Reserve (+🌟)' },
  wins: { fa: 'برنده شد!', en: 'Wins!' },
  score: { fa: 'امتیاز', en: 'Score' },
  playAgain: { fa: 'بازی مجدد', en: 'Play Again' },
  menu: { fa: 'منو', en: 'Menu' },
  pts: { fa: 'امتیاز', en: 'pts' },

  // Tutorial page
  tutorialTitle: { fa: '📖 آموزش بازی', en: '📖 How to Play' },
  stepByStep: { fa: 'آموزش مرحله به مرحله', en: 'Step by Step Tutorial' },
  stepByStepDesc: { fa: 'یادگیری قوانین بازی به صورت تعاملی', en: 'Learn the rules interactively' },
  youtubeTitle: { fa: 'آموزش در یوتیوب', en: 'YouTube Tutorials' },
  youtubeDesc: { fa: 'ویدیوهای آموزشی در YouTube', en: 'Video tutorials on YouTube' },
  aparatTitle: { fa: 'آموزش در آپارات', en: 'Aparat Tutorials' },
  aparatDesc: { fa: 'ویدیوهای آموزشی فارسی', en: 'Persian video tutorials' },
  prev: { fa: '← قبلی', en: '← Previous' },
  back: { fa: '← بازگشت', en: '← Back' },
  next: { fa: 'بعدی →', en: 'Next →' },
  startPlaying: { fa: '🎮 شروع بازی', en: '🎮 Start Playing' },

  // Tutorial steps
  tut1Title: { fa: 'هدف بازی', en: 'Game Objective' },
  tut1Content: { fa: 'هدف شما جمع‌آوری ۱۵ امتیاز منزلت است. امتیازات از خرید کارت‌های توسعه و دیدار با شاهزاده‌ها بدست می‌آید.', en: 'Your goal is to collect 15 prestige points. Points come from purchasing development cards and visiting nobles.' },
  tut1Tip: { fa: 'اولین بازیکنی که به ۱۵ امتیاز برسد، دور آخر را فعال می‌کند.', en: 'The first player to reach 15 points triggers the final round.' },
  tut2Title: { fa: 'توکن‌های جواهر', en: 'Gem Tokens' },
  tut2Content: { fa: 'در هر نوبت می‌توانید ۳ توکن از رنگ‌های مختلف بردارید، یا ۲ توکن از یک رنگ (اگر حداقل ۴ عدد از آن رنگ موجود باشد).', en: 'Each turn you can take 3 tokens of different colors, or 2 tokens of the same color (if at least 4 of that color are available).' },
  tut2Tip: { fa: 'حداکثر ۱۰ توکن می‌توانید داشته باشید. اگر بیشتر شد باید برگردانید.', en: 'You can hold at most 10 tokens. If you have more, you must return some.' },
  tut3Title: { fa: 'خرید کارت', en: 'Buying Cards' },
  tut3Content: { fa: 'با پرداخت توکن‌های لازم، کارت توسعه بخرید. هر کارت یک امتیاز ویژه (تخفیف دائمی) به شما می‌دهد.', en: 'Pay the required tokens to buy a development card. Each card gives you a permanent gem bonus (discount).' },
  tut3Tip: { fa: 'امتیازات ویژه مثل تخفیف عمل می‌کنند و خرید کارت‌های بعدی را ارزان‌تر می‌کنند.', en: 'Gem bonuses act as discounts, making future cards cheaper.' },
  tut4Title: { fa: 'رزرو کارت', en: 'Reserving Cards' },
  tut4Content: { fa: 'می‌توانید یک کارت را رزرو کنید تا بعداً بخرید. با رزرو یک توکن طلا (جوکر) هم دریافت می‌کنید.', en: 'You can reserve a card to buy later. Reserving also gives you a gold (wild) token.' },
  tut4Tip: { fa: 'حداکثر ۳ کارت می‌توانید رزرو داشته باشید. توکن طلا جایگزین هر رنگی می‌شود.', en: 'You can reserve up to 3 cards. Gold tokens can substitute any color.' },
  tut5Title: { fa: 'شاهزاده‌ها', en: 'Nobles' },
  tut5Content: { fa: 'وقتی امتیازات ویژه کافی جمع کنید، شاهزاده خودکار به شما سر می‌زند و ۳ امتیاز منزلت می‌گیرید.', en: 'When you have enough gem bonuses, a noble automatically visits you, granting 3 prestige points.' },
  tut5Tip: { fa: 'دیدار با شاهزاده فقط با امتیازات ویژه (کارت‌ها) ممکن است، نه با توکن‌ها.', en: 'Noble visits are based on card bonuses only, not tokens.' },

  // Complete Manual / دستورالعمل کامل
  fullManual: { fa: 'دستورالعمل کامل بازی', en: 'Complete Game Manual' },
  fullManualDesc: { fa: 'تمام قوانین و توضیحات بازی را بخوانید', en: 'Read all game rules and details' },
  gameRules: { fa: 'قوانین بازی', en: 'Game Rules' },
  setupSection: { fa: 'تنظیم بازی', en: 'Game Setup' },
  setupContent: { fa: 'بازی با ۲ تا ۴ بازیکن بازی می‌شود. هر بازیکن یک صفحه نمایش و ۰ توکن شروع می‌کند. توکن‌های جواهر (۵ رنگ مختلف) و توکن‌های طلا در وسط میز قرار می‌گیرند.', en: 'The game is played with 2-4 players. Each player gets a board and starts with 0 tokens. Gem tokens and gold tokens are placed in the center.' },
  turnSection: { fa: 'نوبت بازی', en: 'Turn Sequence' },
  turnContent: { fa: 'در هر نوبت، بازیکن یکی از این اعمال را انجام می‌دهد:\n1. توکن بردار: ۳ رنگ مختلف یا ۲ از یک رنگ\n2. کارت بخر: توکن‌های لازم را بپرداخت و یک کارت بخر\n3. کارت رزرو کن: یک کارت را برای بعد رزرو کن و ۱ توکن طلا بگیر', en: 'On your turn, choose one action:\n1. Take Tokens: Take 3 different or 2 of the same color\n2. Buy Card: Pay required tokens and purchase a development card\n3. Reserve Card: Reserve a card for later and take a gold token' },
  cardTypesSection: { fa: 'انواع کارت‌ها', en: 'Card Types' },
  cardTypesContent: { fa: 'کارت‌های سطح ۱: ارزان و کم امتیاز\nکارت‌های سطح ۲: متوسط قیمت و امتیاز\nکارت‌های سطح ۳: گران و بیشترین امتیاز', en: 'Level 1 Cards: Cheap, low points\nLevel 2 Cards: Medium cost and points\nLevel 3 Cards: Expensive, highest points' },
  tokenRulesSection: { fa: 'قوانین توکن', en: 'Token Rules' },
  tokenRulesContent: { fa: 'حداکثر ۱۰ توکن می‌توانید نگه دارید\nتوکن‌های طلا جایگزین هر رنگی می‌شوند\nپس از هر خریدِ کارت، امتیازاتِ آن کارت برای همیشه دریافت می‌کنید', en: 'Maximum 10 tokens per player\nGold tokens substitute any color\nCard bonuses are permanent and stack' },
  winConditionSection: { fa: 'شرط پیروزی', en: 'Winning the Game' },
  winConditionContent: { fa: 'اولین بازیکنی که به ۱۵ امتیازِ منزلت برسد، دور نهایی را مشخص می‌کند. دور نهایی ادامه می‌یابد تا همه بازیکنان یک نوبت دیگر را کامل کنند. بازیکنی که بیشترین امتیاز را داشته باشد، برنده است.', en: 'The first player to reach 15 prestige points triggers the final round. The player with the most points after the final round wins.' },
  strategySection: { fa: 'نکات استراتژیک', en: 'Strategic Tips' },
  strategyContent: { fa: '• سعی کنید امتیازاتِ ویژه را جمع کنید قبل از شاهزاده‌ها\n• توکن‌های طلا محدود هستند، احتیاط کنید\n• کارت‌های سطح بالا بیشتر امتیاز می‌دهند اما سفت‌تر است\n• میتوانید رقبای خود را مسدود کنید با کارت‌های خاص', en: '• Build gem bonuses to attract nobles\n• Gold tokens are limited, use wisely\n• Higher level cards give more points but are expensive\n• Strategic card reservations block opponents' },

  // Sound and Audio / صدا و موسیقی
  soundSettings: { fa: 'تنظیمات صدا', en: 'Sound Settings' },
  backgroundMusic: { fa: 'موسیقی پس‌زمینه', en: 'Background Music' },
  soundEffects: { fa: 'جلوه‌های صوتی', en: 'Sound Effects' },
  enableAudio: { fa: 'فعال کردن', en: 'Enable' },
  disableAudio: { fa: 'غیرفعال کردن', en: 'Disable' },

  // Online Chat / چت آنلاین
  chat: { fa: 'چت', en: 'Chat' },
  sendMessage: { fa: 'ارسال پیام', en: 'Send Message' },
  typeMessage: { fa: 'پیام خود را بنویسید...', en: 'Type your message...' },
  microphone: { fa: 'میکروفون', en: 'Microphone' },
  enableMicrophone: { fa: 'روشن کردن میکروفون', en: 'Turn on Microphone' },
  disableMicrophone: { fa: 'خاموش کردن میکروفون', en: 'Turn off Microphone' },
} as const;

export type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('splendor-lang');
    return (saved === 'en' || saved === 'fa') ? saved : 'fa';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('splendor-lang', l);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
