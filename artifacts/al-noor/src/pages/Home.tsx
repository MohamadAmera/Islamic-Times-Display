import React from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { Layout } from '@/components/Layout';
import { PrayerCard } from '@/components/PrayerCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { 
    prayerData, isLoading, error, 
    countdown, nextPrayerIndex, language, isTV, isAthanPlaying 
  } = usePrayerContext();

  const isAr = language === 'ar';

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

  return (
    <Layout>
      <div className={`flex flex-col h-full ${isTV ? 'gap-12' : 'gap-3 md:gap-5'} max-w-[1920px] mx-auto w-full`}>
        
        {/* Countdown Section */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center py-2 md:py-4">
          <h2 className={`text-muted-foreground uppercase tracking-widest font-semibold ${isTV ? 'text-3xl mb-4' : 'text-sm md:text-lg mb-2'}`}>
            {isAr ? `الوقت المتبقي لـ ${nextPrayer?.nameAr || ''}` : `Time remaining until ${nextPrayer?.name || ''}`}
          </h2>
          
          <AnimatePresence mode="wait">
            {isAthanPlaying ? (
              <motion.div
                key="athan"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`font-display font-bold text-primary drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] ${isTV ? 'text-[12rem]' : 'text-6xl md:text-8xl'}`}
              >
                {isAr ? 'حان وقت الأذان' : 'ATHAN TIME'}
              </motion.div>
            ) : (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`font-mono font-bold text-foreground drop-shadow-xl ${isTV ? 'text-[15rem] leading-none' : 'text-7xl md:text-[8rem]'}`}
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prayer Cards Grid/List */}
        <div className={`
          flex-1 w-full
          ${isTV 
            ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8 items-center' 
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4'
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
