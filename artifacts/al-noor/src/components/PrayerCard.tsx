import React from 'react';
import { motion } from 'framer-motion';
import { usePrayerContext } from '@/context/PrayerContext';
import type { PrayerTime } from '@workspace/api-client-react';

interface PrayerCardProps {
  prayer: PrayerTime;
  index: number;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function PrayerCard({ prayer, index }: PrayerCardProps) {
  const { language, isTV, currentPrayerIndex, nextPrayerIndex } = usePrayerContext();
  const isAr = language === 'ar';

  const isNext = index === nextPrayerIndex;
  const isCurrent = index === currentPrayerIndex;

  const formatTime = (time24: string) => {
    if (isAr) return time24;
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${m} ${ampm}`;
  };

  const hasIqama = (prayer.iqamaOffset ?? 0) > 0;
  const iqamaTime = hasIqama ? addMinutes(prayer.time, prayer.iqamaOffset!) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`
        relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500
        ${isNext ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-105 z-10 border-2' : 'glass-card border border-white/5'}
        ${isTV ? 'p-8 md:p-10' : 'p-4 md:p-5'}
        flex flex-row md:flex-col justify-between items-center md:items-start
      `}
    >
      {isNext && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
      )}

      <div className="relative z-10 w-full flex flex-row md:flex-col justify-between items-center md:items-start h-full gap-2">
        {/* Prayer Name */}
        <h3 className={`
          font-display font-bold text-foreground leading-tight
          ${isTV ? 'text-4xl lg:text-5xl mb-1' : 'text-xl md:text-2xl mb-0 md:mb-1'}
          ${isNext ? 'text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : ''}
        `}>
          {isAr ? prayer.nameAr : prayer.name}
        </h3>

        {/* Adhan time */}
        <div className="flex flex-col items-end md:items-start gap-0.5">
          <div className={`
            font-mono font-semibold text-foreground leading-none
            ${isTV ? 'text-5xl lg:text-6xl' : 'text-2xl md:text-3xl'}
            ${isNext ? 'text-white' : 'text-muted-foreground'}
          `}>
            {formatTime(prayer.time)}
          </div>

          {/* Iqama time */}
          {iqamaTime && (
            <div className={`
              flex items-center gap-1 mt-1
              ${isTV ? 'text-lg' : 'text-xs md:text-sm'}
            `}>
              <span className={`
                font-semibold uppercase tracking-wider
                ${isNext ? 'text-primary/80' : 'text-muted-foreground/60'}
              `} style={{ fontSize: isTV ? '0.9rem' : '0.65rem', letterSpacing: '0.1em' }}>
                {isAr ? 'إقامة' : 'IQAMA'}
              </span>
              <span className={`
                font-mono font-bold
                ${isNext ? 'text-primary' : 'text-muted-foreground/80'}
              `}>
                {formatTime(iqamaTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {isCurrent && !isNext && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/50" />
      )}
    </motion.div>
  );
}
