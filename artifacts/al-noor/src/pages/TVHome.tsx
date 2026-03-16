import React, { useEffect, useState } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

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
    themeClass, isAthanPlaying,
  } = usePrayerContext();

  const [, navigate] = useLocation();
  const now = useClock();

  // TV mode is always bilingual — Arabic primary
  const timeStr = now.toLocaleTimeString('ar-SA', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const hijriAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const hijriEn = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const gregAr = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const gregEn = new Intl.DateTimeFormat('en-US', {
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

  // Countdown: only HH:MM (no seconds)
  const [h, m] = countdown.split(':');

  return (
    <div
      className={`min-h-screen w-full flex flex-col overflow-hidden relative select-none ${themeClass}`}
      style={{ fontFamily: "'Outfit', 'Amiri', 'Noto Naskh Arabic', sans-serif" }}
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
            الله أكبر
          </div>
          <div style={{ fontSize: 'clamp(1.5rem,3vw,3.5rem)', color: '#d6a93e', opacity: 0.9, marginTop: '0.5rem', fontWeight: 700 }}>
            {nextPrayer?.nameAr || ''}
          </div>
          <div style={{ fontSize: 'clamp(1rem,1.8vw,2rem)', color: '#d6a93e', opacity: 0.6, marginTop: '0.25rem' }}>
            {nextPrayer?.name || ''}  •  ATHAN TIME
          </div>
        </div>
      )}

      {/* ══════ TOP BAR ══════ */}
      <header
        className="flex items-center justify-between px-10 py-5 z-10 shrink-0"
        style={{ borderBottom: '1px solid rgba(214,169,62,0.25)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}
      >
        {/* Left: Mosque name — bilingual */}
        <div className="flex flex-col" style={{ minWidth: '28%' }}>
          <h1 style={{ fontSize: 'clamp(1.4rem,2.2vw,2.6rem)', fontWeight: 700, color: '#d6a93e', lineHeight: 1.2, direction: 'rtl', textAlign: 'right' }}>
            {prayerData?.mosque?.nameAr || 'النور'}
          </h1>
          <h2 style={{ fontSize: 'clamp(1rem,1.4vw,1.6rem)', fontWeight: 600, color: 'rgba(214,169,62,0.65)', lineHeight: 1.2, marginTop: 2 }}>
            {prayerData?.mosque?.name || 'Al-Noor'}
          </h2>
          <p style={{ fontSize: 'clamp(0.75rem,0.95vw,1.1rem)', color: '#9ca19d', marginTop: 4 }}>
            {prayerData?.mosque?.address}
          </p>
        </div>

        {/* Center: Live clock + bilingual date */}
        <div className="flex flex-col items-center" style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Outfit', monospace",
              fontSize: 'clamp(3.8rem,6.5vw,7rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.06em',
              lineHeight: 1,
              textShadow: '0 0 30px rgba(255,255,255,0.15)',
            }}
          >
            {timeStr}
          </div>
          {/* Bilingual date row */}
          <div className="flex items-center gap-3 mt-1" style={{ fontSize: 'clamp(0.85rem,1.05vw,1.15rem)', color: '#9ca19d' }}>
            <span style={{ direction: 'rtl' }}>{gregAr}</span>
            <span style={{ color: 'rgba(214,169,62,0.35)' }}>|</span>
            <span>{gregEn}</span>
          </div>
        </div>

        {/* Right: Hijri bilingual + exit */}
        <div className="flex flex-col items-end" style={{ minWidth: '28%' }}>
          <div style={{ fontSize: 'clamp(1.1rem,1.7vw,2rem)', fontWeight: 700, color: '#d6a93e', textAlign: 'end', direction: 'rtl' }}>
            {hijriAr}
          </div>
          <div style={{ fontSize: 'clamp(0.85rem,1.1vw,1.3rem)', color: 'rgba(214,169,62,0.6)', textAlign: 'end', marginTop: 2 }}>
            {hijriEn}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 10, fontSize: '0.85rem', padding: '5px 16px', borderRadius: 8,
              background: 'rgba(214,169,62,0.15)', color: '#d6a93e',
              border: '1px solid rgba(214,169,62,0.3)', cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            EXIT TV / عادي
          </button>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 flex gap-0 z-10 overflow-hidden" style={{ minHeight: 0 }}>

        {/* LEFT: Countdown panel */}
        <div
          className="flex flex-col items-center justify-center gap-5"
          style={{
            width: '38%',
            padding: '3vw',
            borderRight: '1px solid rgba(214,169,62,0.18)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {/* Current period — bilingual */}
          <div className="flex flex-col items-center gap-1">
            <div style={{ fontSize: 'clamp(0.85rem,1vw,1rem)', color: '#9ca19d', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              الوقت الحالي  •  Current Period
            </div>
            <div style={{ fontSize: 'clamp(1.6rem,2.8vw,3.2rem)', color: '#9ca19d', fontWeight: 600, direction: 'rtl' }}>
              {currentPrayer?.nameAr}
              <span style={{ fontSize: '60%', color: '#9ca19d', opacity: 0.6, marginRight: '0.6em', direction: 'ltr', fontFamily: "'Outfit', sans-serif" }}>
                {' '}{currentPrayer?.name}
              </span>
            </div>
          </div>

          {/* Gold separator */}
          <div style={{ width: 80, height: 2, background: 'linear-gradient(to right, transparent, #d6a93e, transparent)', borderRadius: 2 }} />

          {/* Time remaining label — bilingual */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(0.8rem,0.95vw,1.05rem)', color: '#9ca19d', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
              الوقت المتبقي لـ  •  Next Prayer
            </div>
            {/* Next prayer name bilingual */}
            <div style={{ lineHeight: 1.15, textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2.2rem,4.5vw,5.5rem)', fontWeight: 900, color: '#d6a93e', direction: 'rtl' }}>
                {nextPrayer?.nameAr}
              </div>
              <div style={{ fontSize: 'clamp(1rem,1.5vw,1.8rem)', color: 'rgba(214,169,62,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                {nextPrayer?.name}
              </div>
            </div>
          </div>

          {/* Countdown digits — HH:MM only (no seconds) */}
          <div className="flex items-center gap-4">
            {[h, m].map((unit, i) => (
              <React.Fragment key={i}>
                <div
                  className="flex flex-col items-center"
                  style={{
                    background: 'rgba(214,169,62,0.1)',
                    border: '1px solid rgba(214,169,62,0.35)',
                    borderRadius: 16,
                    padding: 'clamp(10px,1.4vw,22px) clamp(16px,2.2vw,36px)',
                    minWidth: 'clamp(90px,11vw,145px)',
                  }}
                >
                  <div style={{ fontSize: 'clamp(3rem,6vw,7.5rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, fontFamily: "'Outfit', monospace", letterSpacing: '0.02em' }}>
                    {unit}
                  </div>
                  <div className="flex flex-col items-center gap-0" style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 'clamp(0.7rem,0.85vw,0.95rem)', color: '#9ca19d', letterSpacing: '0.15em' }}>
                      {i === 0 ? 'ساعة' : 'دقيقة'}
                    </div>
                    <div style={{ fontSize: 'clamp(0.6rem,0.7vw,0.75rem)', color: '#9ca19d', opacity: 0.6, letterSpacing: '0.15em' }}>
                      {i === 0 ? 'HRS' : 'MIN'}
                    </div>
                  </div>
                </div>
                {i < 1 && (
                  <div style={{ fontSize: 'clamp(2.5rem,5vw,6rem)', fontWeight: 900, color: 'rgba(214,169,62,0.6)', lineHeight: 1, marginBottom: 30 }}>:</div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next prayer adhan time */}
          <div style={{ fontSize: 'clamp(1.4rem,2.2vw,2.8rem)', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', monospace", letterSpacing: '0.08em' }}>
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
                    padding: 'clamp(16px,2.2vw,36px)',
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
                  {/* Top: bilingual name + badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      {/* Arabic name */}
                      <div style={{ fontSize: 'clamp(1.6rem,2.5vw,3.2rem)', fontWeight: 800, color: isNext ? '#d6a93e' : '#ffffff', lineHeight: 1.1, direction: 'rtl' }}>
                        {prayer.nameAr}
                      </div>
                      {/* English transliteration */}
                      <div style={{ fontSize: 'clamp(0.8rem,1vw,1.15rem)', color: isNext ? 'rgba(214,169,62,0.7)' : '#9ca19d', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                        {prayer.name}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isNext && (
                        <span style={{
                          fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20,
                          background: '#d6a93e', color: '#1a2420', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>
                          NEXT
                        </span>
                      )}
                      {isNext && (
                        <span style={{
                          fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20,
                          background: 'rgba(214,169,62,0.2)', color: '#d6a93e', fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}>
                          التالي
                        </span>
                      )}
                      {isCurrent && !isNext && (
                        <>
                          <span style={{
                            fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20,
                            background: 'rgba(156,161,157,0.3)', color: '#9ca19d', fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                          }}>NOW</span>
                          <span style={{
                            fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20,
                            background: 'rgba(156,161,157,0.15)', color: '#9ca19d', fontWeight: 700,
                          }}>الآن</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Adhan + Iqama times */}
                  <div className="flex flex-col gap-1.5">
                    {/* Adhan label + time */}
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontSize: 'clamp(0.6rem,0.7vw,0.8rem)', color: '#9ca19d', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        أذان / ADHAN
                      </span>
                      <span style={{
                        fontFamily: "'Outfit', monospace",
                        fontSize: 'clamp(1.8rem,3.2vw,4rem)',
                        fontWeight: 800,
                        color: isNext ? '#ffffff' : isPast ? '#9ca19d' : 'rgba(255,255,255,0.85)',
                        letterSpacing: '0.05em',
                        lineHeight: 1,
                      }}>
                        {prayer.time}
                      </span>
                    </div>
                    {/* Iqama line */}
                    {(prayer.iqamaOffset ?? 0) > 0 && (
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontSize: 'clamp(0.6rem,0.7vw,0.8rem)', color: isNext ? 'rgba(214,169,62,0.7)' : '#9ca19d', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                          إقامة / IQAMA
                        </span>
                        <span style={{
                          fontFamily: "'Outfit', monospace",
                          fontSize: 'clamp(1.3rem,2vw,2.5rem)',
                          fontWeight: 700,
                          color: isNext ? '#d6a93e' : isPast ? '#9ca19d' : 'rgba(214,169,62,0.75)',
                          letterSpacing: '0.05em',
                          lineHeight: 1,
                        }}>
                          {addMinutes(prayer.time, prayer.iqamaOffset!)}
                        </span>
                        <span style={{ fontSize: 'clamp(0.55rem,0.65vw,0.75rem)', color: '#9ca19d', opacity: 0.6 }}>
                          +{prayer.iqamaOffset}م
                        </span>
                      </div>
                    )}
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
            style={{ background: '#d6a93e', padding: '11px 0', borderTop: '1px solid rgba(214,169,62,0.4)' }}
          >
            <div
              className="font-bold shrink-0 px-6 flex flex-col items-center leading-tight"
              style={{ fontSize: 'clamp(1rem,1.4vw,1.6rem)', color: '#1a2420', borderRight: '2px solid rgba(26,36,32,0.3)', marginRight: 16 }}
            >
              <span>أخبار</span>
              <span style={{ fontSize: '75%', opacity: 0.7, letterSpacing: '0.1em' }}>NEWS</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className="inline-block animate-marquee"
                style={{ fontSize: 'clamp(1rem,1.35vw,1.6rem)', color: '#1a2420', fontWeight: 500 }}
              >
                {/* Show both Arabic and English for each item */}
                {prayerData.news.map(n => `${n.textAr}  ·  ${n.text}`).join('  ✦  ')}
                <span style={{ opacity: 0 }}>  ✦  </span>
                {prayerData.news.map(n => `${n.textAr}  ·  ${n.text}`).join('  ✦  ')}
              </div>
            </div>
          </div>
        )}

        {prayerData?.azkar && prayerData.azkar.length > 0 && (
          <div
            className="flex overflow-hidden whitespace-nowrap items-center"
            style={{ background: 'rgba(0,0,0,0.4)', padding: '13px 0', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(214,169,62,0.15)' }}
          >
            <div
              className="font-bold shrink-0 px-6 flex flex-col items-center leading-tight"
              style={{ fontSize: 'clamp(1rem,1.4vw,1.6rem)', color: '#d6a93e', borderRight: '1px solid rgba(214,169,62,0.3)', marginRight: 16 }}
            >
              <span>أذكار</span>
              <span style={{ fontSize: '75%', opacity: 0.6, letterSpacing: '0.1em', fontFamily: "'Outfit', sans-serif" }}>DHIKR</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className="inline-block animate-marquee"
                style={{ fontSize: 'clamp(1rem,1.35vw,1.6rem)', color: 'rgba(255,255,255,0.85)' }}
              >
                {/* Both Arabic and English for each dhikr */}
                {prayerData.azkar.map(a => `${a.textAr}  ·  ${a.text}  (${a.sourceAr} / ${a.source})`).join('  ✦  ')}
                <span style={{ opacity: 0 }}>  ✦  </span>
                {prayerData.azkar.map(a => `${a.textAr}  ·  ${a.text}  (${a.sourceAr} / ${a.source})`).join('  ✦  ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
