import React from 'react';
import { motion } from 'framer-motion';
import { usePrayerContext } from '@/context/PrayerContext';
import type { PrayerTime } from '@workspace/api-client-react';

interface PrayerCardProps {
  prayer: PrayerTime;
  index: number;
}

export function PrayerCard({ prayer, index }: PrayerCardProps) {
  const { language, isTV, currentPrayerIndex, nextPrayerIndex } = usePrayerContext();
  const isAr = language === 'ar';
  
  const isNext = index === nextPrayerIndex;
  const isCurrent = index === currentPrayerIndex;

  // Format time from 24h to 12h for English
  const formatTime = (time24: string) => {
    if (isAr) return time24; // Keep 24h for Arabic or convert if preferred
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${m} ${ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`
        relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500
        ${isNext ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-105 z-10 border-2' : 'glass-card border border-white/5'}
        ${isTV ? 'p-8 md:p-12' : 'p-4 md:p-6'}
        flex flex-row md:flex-col justify-between items-center md:items-start
      `}
    >
      {/* Glow effect for next prayer */}
      {isNext && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
      )}
      
      <div className="relative z-10 w-full flex flex-row md:flex-col justify-between items-center md:items-start h-full">
        <h3 className={`
          font-display font-bold text-foreground
          ${isTV ? 'text-5xl lg:text-6xl mb-4' : 'text-xl md:text-3xl mb-0 md:mb-2'}
          ${isNext ? 'text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : ''}
        `}>
          {isAr ? prayer.nameAr : prayer.name}
        </h3>
        
        <div className={`
          font-mono font-semibold text-foreground
          ${isTV ? 'text-6xl lg:text-7xl' : 'text-2xl md:text-4xl'}
          ${isNext ? 'text-white' : 'text-muted-foreground'}
        `}>
          {formatTime(prayer.time)}
        </div>
      </div>
      
      {isCurrent && !isNext && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/50" />
      )}
    </motion.div>
  );
}
