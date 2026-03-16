import React, { useEffect, useState } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TVHome() {
  const {
    prayerData, isLoading,
    countdown, nextPrayerIndex, currentPrayerIndex,
    language, themeClass, isAthanPlaying,
  } = usePrayerContext();

  const [, navigate] = useLocation();
  const now = useClock();
  const isAr = language === 'ar';

  const timeStr = now.toLocaleTimeString(isAr ? 'ar-SA' : 'en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const hijriStr = new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const gregStr = new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${themeClass} flex items-center justify-center`}>
        <Loader2 className="w-20 h-20 text-primary animate-spin" />
      </div>
    );
  }

  const prayers = prayerData?.prayers?.filter(p => p.enabled) ?? [];
  const nextPrayer = prayers[nextPrayerIndex];
  const currentPrayer = prayers[currentPrayerIndex];
  const mosqueName = isAr ? prayerData?.mosque?.nameAr : prayerData?.mosque?.name;
  const mosqueAddr = isAr ? prayerData?.mosque?.addressAr : prayerData?.mosque?.address;

  const [h, m, s] = countdown.split(':');

  return (
    <div
      className={`min-h-screen w-full flex flex-col overflow-hidden relative select-none ${themeClass}`}
      style={{ fontFamily: isAr ? "'Amiri', 'Noto Naskh Arabic', serif" : "'Outfit', 'Inter', sans-serif" }}
    >
      {/* Subtle geometric overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23d6a93e' stroke-width='1'/%3E%3Cpath d='M40 14L66 40L40 66L14 40Z' fill='none' stroke='%23d6a93e' stroke-width='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Athan overlay */}
      {isAthanPlaying && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div
            className="font-bold text-center"
            style={{ fontSize: 'clamp(4rem,10vw,10rem)', color: '#d6a93e', textShadow: '0 0 60px rgba(214,169,62,0.8)', lineHeight: 1.1 }}
          >
            {isAr ? 'الله أكبر' : 'ATHAN TIME'}
          </div>
          <div style={{ fontSize: '3rem', color: '#d6a93e', opacity: 0.7, marginTop: '1rem' }}>
            {isAr ? `حان وقت ${nextPrayer?.nameAr || ''}` : `Time for ${nextPrayer?.name || ''}`}
          </div>
        </div>
      )}

      {/* ══════ TOP BAR ══════ */}
      <header
        className="flex items-center justify-between px-10 py-5 z-10 shrink-0"
        style={{ borderBottom: '1px solid rgba(214,169,62,0.25)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}
      >
        {/* Left: Mosque name */}
        <div className="flex flex-col" style={{ minWidth: '30%' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,2.5vw,2.8rem)', fontWeight: 700, color: '#d6a93e', lineHeight: 1.15 }}>
            {mosqueName || 'Al-Noor'}
          </h1>
          <p style={{ fontSize: 'clamp(0.85rem,1.1vw,1.2rem)', color: '#9ca19d', marginTop: 4 }}>
            {mosqueAddr}
          </p>
        </div>

        {/* Center: Live clock */}
        <div className="flex flex-col items-center" style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Outfit', 'Inter', monospace",
              fontSize: 'clamp(3.5rem,6vw,6.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.06em',
              lineHeight: 1,
              textShadow: '0 0 30px rgba(255,255,255,0.15)',
            }}
          >
            {timeStr}
          </div>
          <div style={{ fontSize: 'clamp(0.9rem,1.1vw,1.2rem)', color: '#9ca19d', marginTop: 6, letterSpacing: '0.05em' }}>
            {gregStr}
          </div>
        </div>

        {/* Right: Hijri date + nav */}
        <div className="flex flex-col items-end" style={{ minWidth: '30%' }}>
          <div style={{ fontSize: 'clamp(1.2rem,1.8vw,2rem)', fontWeight: 700, color: '#d6a93e', textAlign: 'end' }}>
            {hijriStr}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 8, fontSize: '0.85rem', padding: '4px 14px', borderRadius: 8,
              background: 'rgba(214,169,62,0.15)', color: '#d6a93e',
              border: '1px solid rgba(214,169,62,0.3)', cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            {isAr ? 'عادي' : 'EXIT TV'}
          </button>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 flex gap-0 z-10 overflow-hidden" style={{ minHeight: 0 }}>

        {/* LEFT: Countdown panel */}
        <div
          className="flex flex-col items-center justify-center gap-6"
          style={{
            width: '38%',
            padding: '3vw',
            borderRight: '1px solid rgba(214,169,62,0.18)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {/* Current period label */}
          <div style={{ fontSize: 'clamp(0.85rem,1vw,1rem)', color: '#9ca19d', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            {isAr ? 'الوقت الحالي' : 'Current Period'}
          </div>
          <div style={{ fontSize: 'clamp(1.5rem,2.5vw,2.8rem)', color: '#9ca19d', fontWeight: 500 }}>
            {isAr ? currentPrayer?.nameAr : currentPrayer?.name}
          </div>

          {/* Gold separator */}
          <div style={{ width: 80, height: 2, background: 'linear-gradient(to right, transparent, #d6a93e, transparent)', borderRadius: 2 }} />

          {/* Next prayer label */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(0.75rem,0.9vw,0.95rem)', color: '#9ca19d', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>
              {isAr ? 'الوقت المتبقي لـ' : 'Time remaining until'}
            </div>
            <div style={{ fontSize: 'clamp(2rem,4vw,4.5rem)', fontWeight: 800, color: '#d6a93e', lineHeight: 1 }}>
              {isAr ? nextPrayer?.nameAr : nextPrayer?.name}
            </div>
          </div>

          {/* Countdown digits */}
          <div className="flex items-center gap-3">
            {[h, m, s].map((unit, i) => (
              <React.Fragment key={i}>
                <div
                  className="flex flex-col items-center"
                  style={{
                    background: 'rgba(214,169,62,0.1)',
                    border: '1px solid rgba(214,169,62,0.35)',
                    borderRadius: 16,
                    padding: 'clamp(8px,1.2vw,18px) clamp(12px,1.8vw,28px)',
                    minWidth: 'clamp(80px,10vw,130px)',
                  }}
                >
                  <div style={{ fontSize: 'clamp(2.5rem,5vw,6rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, fontFamily: "'Outfit', monospace", letterSpacing: '0.02em' }}>
                    {unit}
                  </div>
                  <div style={{ fontSize: 'clamp(0.6rem,0.75vw,0.8rem)', color: '#9ca19d', marginTop: 4, letterSpacing: '0.15em' }}>
                    {['HRS','MIN','SEC'][i]}
                  </div>
                </div>
                {i < 2 && (
                  <div style={{ fontSize: 'clamp(2rem,4vw,5rem)', fontWeight: 900, color: 'rgba(214,169,62,0.6)', lineHeight: 1, marginBottom: 24 }}>:</div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next prayer time */}
          <div style={{ fontSize: 'clamp(1.2rem,2vw,2.5rem)', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', monospace", letterSpacing: '0.08em' }}>
            {nextPrayer?.time}
          </div>
        </div>

        {/* RIGHT: Prayer grid */}
        <div
          className="flex-1 flex flex-col justify-center"
          style={{ padding: '2.5vw 3vw' }}
        >
          <div
            className="grid gap-4 h-full"
            style={{ gridTemplateColumns: `repeat(${prayers.length <= 4 ? 2 : 3}, 1fr)`, gridTemplateRows: 'repeat(2, 1fr)', alignItems: 'stretch' }}
          >
            {prayers.map((prayer, idx) => {
              const isNext = idx === nextPrayerIndex;
              const isCurrent = idx === currentPrayerIndex;
              const isPast = currentPrayerIndex >= 0
                ? (idx < nextPrayerIndex && idx !== currentPrayerIndex)
                : false;

              return (
                <div
                  key={prayer.name}
                  className="flex flex-col justify-between rounded-2xl transition-all duration-500"
                  style={{
                    padding: 'clamp(16px,2vw,32px)',
                    background: isNext
                      ? 'rgba(214,169,62,0.18)'
                      : isCurrent
                        ? 'rgba(156,161,157,0.12)'
                        : 'rgba(62,68,66,0.7)',
                    border: isNext
                      ? '2px solid rgba(214,169,62,0.7)'
                      : isCurrent
                        ? '1px solid rgba(156,161,157,0.4)'
                        : '1px solid rgba(156,161,157,0.12)',
                    boxShadow: isNext ? '0 0 40px rgba(214,169,62,0.2)' : 'none',
                    opacity: isPast ? 0.45 : 1,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Top: labels */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div style={{ fontSize: 'clamp(1.4rem,2.2vw,2.8rem)', fontWeight: 800, color: isNext ? '#d6a93e' : '#ffffff', lineHeight: 1.1 }}>
                        {prayer.nameAr}
                      </div>
                      <div style={{ fontSize: 'clamp(0.75rem,0.9vw,1rem)', color: '#9ca19d', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>
                        {prayer.name}
                      </div>
                    </div>
                    {isNext && (
                      <span style={{
                        fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20,
                        background: '#d6a93e', color: '#1a2420', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>
                        {isAr ? 'التالي' : 'NEXT'}
                      </span>
                    )}
                    {isCurrent && !isNext && (
                      <span style={{
                        fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20,
                        background: 'rgba(156,161,157,0.3)', color: '#9ca19d', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>
                        {isAr ? 'الآن' : 'NOW'}
                      </span>
                    )}
                  </div>

                  {/* Bottom: time */}
                  <div style={{
                    fontFamily: "'Outfit', monospace",
                    fontSize: 'clamp(1.8rem,3vw,4rem)',
                    fontWeight: 800,
                    color: isNext ? '#ffffff' : isPast ? '#9ca19d' : 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                  }}>
                    {prayer.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ══════ TICKERS ══════ */}
      <div className="z-10 shrink-0">
        {prayerData?.news && prayerData.news.length > 0 && (
          <div
            className="flex overflow-hidden whitespace-nowrap items-center"
            style={{ background: '#d6a93e', padding: '10px 0', borderTop: '1px solid rgba(214,169,62,0.4)' }}
          >
            <div
              className="font-bold shrink-0 px-6"
              style={{ fontSize: 'clamp(1rem,1.4vw,1.6rem)', color: '#1a2420', borderRight: '2px solid rgba(26,36,32,0.3)', marginRight: 16 }}
            >
              {isAr ? 'أخبار' : 'NEWS'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className="inline-block animate-marquee"
                style={{ fontSize: 'clamp(1rem,1.3vw,1.5rem)', color: '#1a2420', fontWeight: 500 }}
              >
                {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
                <span style={{ opacity: 0 }}>  •  </span>
                {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
              </div>
            </div>
          </div>
        )}

        {prayerData?.azkar && prayerData.azkar.length > 0 && (
          <div
            className="flex overflow-hidden whitespace-nowrap items-center"
            style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 0', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(214,169,62,0.15)' }}
          >
            <div
              className="font-bold shrink-0 px-6"
              style={{ fontSize: 'clamp(1rem,1.4vw,1.6rem)', color: '#d6a93e', borderRight: '1px solid rgba(214,169,62,0.3)', marginRight: 16 }}
            >
              {isAr ? 'أذكار' : 'DHIKR'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className="inline-block animate-marquee"
                style={{
                  fontSize: 'clamp(1rem,1.3vw,1.5rem)',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: isAr ? "'Amiri', serif" : "'Inter', sans-serif",
                }}
              >
                {prayerData.azkar.map(a => `${isAr ? a.textAr : a.text} (${isAr ? a.sourceAr : a.source})`).join('  ✦  ')}
                <span style={{ opacity: 0 }}>  ✦  </span>
                {prayerData.azkar.map(a => `${isAr ? a.textAr : a.text} (${isAr ? a.sourceAr : a.source})`).join('  ✦  ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
