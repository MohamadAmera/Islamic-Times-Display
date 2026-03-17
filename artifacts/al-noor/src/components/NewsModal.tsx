import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsItem } from '@workspace/api-client-react';

interface NewsModalProps {
  news: NewsItem[];
  isAr: boolean;
  onClose: () => void;
}

export function NewsModal({ news, isAr: initialLang, onClose }: NewsModalProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lang, setLang] = useState<'ar' | 'de'>(initialLang ? 'ar' : 'de');

  const isAr = lang === 'ar';
  const item = news[index];
  const total = news.length;

  const go = (dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= total) return;
    setDirection(dir);
    setIndex(next);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <motion.div
      key="news-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-5"
      onClick={onClose}
    >
      <motion.div
        key="news-modal-card"
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#2a322e', border: '1px solid rgba(214,169,62,0.35)' }}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Newspaper size={17} className="text-primary shrink-0" />
            <h2 className="text-primary font-bold text-sm leading-tight">
              {isAr ? 'إعلان المسجد' : 'Moschee-Mitteilung'}
            </h2>
          </div>
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'ar' ? 'de' : 'ar')}
            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            {isAr ? 'DE' : 'AR'}
          </button>
        </div>

        {/* ── News content (animated slide) ── */}
        <div className="px-5 pt-5 pb-3 min-h-[120px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={`${index}-${lang}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="text-foreground text-sm leading-relaxed"
              style={{
                fontFamily: isAr ? "'Amiri', 'Noto Naskh Arabic', serif" : undefined,
                fontSize: isAr ? '1rem' : '0.875rem',
              }}
            >
              {isAr ? item.textAr : item.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Navigation (prev / counter / next) ── */}
        {total > 1 && (
          <div className="flex items-center justify-between px-5 pb-3">
            <button
              onClick={() => go(isAr ? 1 : -1)}
              disabled={isAr ? index >= total - 1 : index === 0}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
            >
              {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            <span className="text-muted-foreground text-xs tabular-nums" dir="ltr">
              {index + 1} / {total}
            </span>

            <button
              onClick={() => go(isAr ? -1 : 1)}
              disabled={isAr ? index === 0 : index >= total - 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
            >
              {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        )}

        {/* ── Dot indicators ── */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {news.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-primary w-3' : 'bg-white/25'}`}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-5 pb-5 pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
            style={{ background: '#d6a93e', color: '#1a211d' }}
          >
            {isAr ? 'موافق' : 'OK'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
