import React, { useState, useEffect } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { Layout } from '@/components/Layout';
import { PrayerCard } from '@/components/PrayerCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Home() {
  const { 
    prayerData, isLoading, error, 
    countdown, nextPrayerIndex, currentPrayerIndex, language, isTV, isAthanPlaying 
  } = usePrayerContext();

  const isAr = language === 'ar';
  const now = useClock();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !prayerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive">
        <div className="glass-panel p-8 text-center rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p>Please check your connection or try again later.</p>
        </div>
      </div>
    );
  }

  const prayers = prayerData.prayers.filter(p => p.enabled);
  const nextPrayer = prayers[nextPrayerIndex];

  const timeStr = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const hijriAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(now);

  const gregorianDe = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(now);

  const [ch, cm] = countdown.split(':');
  const countdownHM = `${parseInt(ch || '0', 10)} h ${cm || '00'} min`;

  return (
    <Layout>
      {/* ═══════ MOBILE VIEW — no-scroll, fills screen ═══════ */}
      <div className="md:hidden flex flex-col h-full pt-8 justify-between">

        {/* Quranic verse — compact */}
        <div className="text-center shrink-0">
          <p
            style={{
              fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
              fontSize: 'clamp(0.95rem, 4.2vw, 1.25rem)',
              color: '#d6a93e',
              direction: 'rtl',
              lineHeight: 1.7,
            }}
          >
            إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ
            <span style={{ fontWeight: 700 }}> كِتَابًا مَّوْقُوتًا</span>
          </p>
        </div>

        {/* Date + clock — single compact row */}
        <div className="text-center shrink-0">
          <p className="text-muted-foreground text-xs leading-tight">
            {gregorianDe}
          </p>
          <p className="text-foreground font-mono text-base font-bold tracking-wider">
            {timeStr}
          </p>
        </div>

        {/* Prayer rows */}
        <div className="flex flex-col gap-2 px-1">
          {prayers.map((prayer, idx) => {
            const isNext = idx === nextPrayerIndex;
            const isPast = currentPrayerIndex >= 0
              ? idx < nextPrayerIndex && idx !== currentPrayerIndex
              : false;

            return (
              <motion.div
                key={prayer.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300
                  ${isNext
                    ? 'bg-primary/20 border-2 border-primary shadow-[0_0_16px_rgba(214,169,62,0.2)]'
                    : 'bg-white/5 border border-white/10'
                  }
                  ${isPast ? 'opacity-40' : ''}
                `}
              >
                <span className={`font-semibold text-sm w-16 ${isNext ? 'text-primary' : 'text-foreground'}`}>
                  {prayer.name}
                </span>
                <span className={`font-mono font-bold text-base tabular-nums ${isNext ? 'text-white' : 'text-muted-foreground'}`}>
                  {prayer.time}
                </span>
                <span
                  className={`text-sm w-16 text-right ${isNext ? 'text-primary' : 'text-foreground'}`}
                  style={{ direction: 'rtl', fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                >
                  {prayer.nameAr}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Countdown — bottom */}
        <div className="text-center shrink-0 pb-2">
          <p className="text-muted-foreground text-xs mb-1">
            {isAr
              ? `الوقت المتبقي لصلاة ${nextPrayer?.nameAr || ''}`
              : `Zeit bis zum ${nextPrayer?.name || ''}-Gebet`}
          </p>
          <AnimatePresence mode="wait">
            {isAthanPlaying ? (
              <motion.div
                key="athan-mobile"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="font-display font-bold text-primary text-2xl drop-shadow-[0_0_15px_rgba(214,169,62,0.6)]"
              >
                {isAr ? 'حان وقت الأذان' : 'GEBETSZEIT'}
              </motion.div>
            ) : (
              <motion.div
                key="countdown-mobile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-block px-5 py-1.5 rounded-xl bg-white/5 border border-white/10"
              >
                <span className="font-mono font-bold text-lg text-foreground tracking-wider">
                  {countdownHM}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════ DESKTOP VIEW ═══════ */}
      <div className={`hidden md:flex flex-col h-full ${isTV ? 'gap-12' : 'gap-5'} max-w-[1920px] mx-auto w-full`}>
        
        {/* Countdown Section */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center py-4">
          <h2 className={`text-muted-foreground uppercase tracking-widest font-semibold ${isTV ? 'text-3xl mb-4' : 'text-lg mb-2'}`}>
            {isAr ? `الوقت المتبقي لـ ${nextPrayer?.nameAr || ''}` : `Time remaining until ${nextPrayer?.name || ''}`}
          </h2>
          
          <AnimatePresence mode="wait">
            {isAthanPlaying ? (
              <motion.div
                key="athan"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`font-display font-bold text-primary drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] ${isTV ? 'text-[12rem]' : 'text-8xl'}`}
              >
                {isAr ? 'حان وقت الأذان' : 'ATHAN TIME'}
              </motion.div>
            ) : (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`font-mono font-bold text-foreground drop-shadow-xl ${isTV ? 'text-[15rem] leading-none' : 'text-[8rem]'}`}
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prayer Cards Grid */}
        <div className={`
          flex-1 w-full
          ${isTV 
            ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8 items-center' 
            : 'grid grid-cols-3 lg:grid-cols-6 gap-4'
          }
        `}>
          {prayers.map((prayer, index) => (
            <PrayerCard key={prayer.name} prayer={prayer} index={index} />
          ))}
        </div>
        
      </div>
    </Layout>
  );
}
