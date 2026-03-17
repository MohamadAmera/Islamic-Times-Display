import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import type { NewsItem } from '@workspace/api-client-react';

interface NewsModalProps {
  news: NewsItem[];
  isAr: boolean;
  onClose: () => void;
}

export function NewsModal({ news, isAr, onClose }: NewsModalProps) {
  return (
    <AnimatePresence>
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
          {/* Header bar */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
            <Newspaper size={18} className="text-primary shrink-0" />
            <h2 className="text-primary font-bold text-base leading-tight">
              {isAr ? 'إعلان المسجد' : 'Moschee-Mitteilung'}
            </h2>
          </div>

          {/* News items */}
          <div className="px-5 py-4 space-y-3 max-h-72 overflow-y-auto">
            {news.map((item, i) => (
              <p
                key={i}
                className="text-foreground text-sm leading-relaxed"
                style={{ fontFamily: isAr ? "'Amiri', 'Noto Naskh Arabic', serif" : undefined }}
              >
                {isAr ? item.textAr : item.text}
              </p>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{ background: '#d6a93e', color: '#1a211d' }}
            >
              {isAr ? 'موافق، شكراً' : 'OK, danke'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
