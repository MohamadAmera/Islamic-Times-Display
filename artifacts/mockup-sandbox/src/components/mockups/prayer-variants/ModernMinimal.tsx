import './_group.css';
import { useEffect, useState } from 'react';

const PRAYERS = [
  { name: 'Fajr',    nameAr: 'الفجر',    time: '04:26' },
  { name: 'Shuruk',  nameAr: 'الشروق',   time: '06:16' },
  { name: 'Dhuhr',   nameAr: 'الظهر',    time: '12:22' },
  { name: 'Asr',     nameAr: 'العصر',    time: '15:29' },
  { name: 'Maghrib', nameAr: 'المغرب',   time: '18:18' },
  { name: 'Isha',    nameAr: 'العشاء',   time: '20:01' },
];

const NEWS = 'Jumu\'ah Prayer at 1:00 PM  •  Quran Classes every Saturday  •  Islamic Studies every Sunday  •  All are welcome';
const DHIKR = 'SubhanAllah — Glory be to Allah  ✦  Alhamdulillah — Praise be to Allah  ✦  Allahu Akbar — Allah is Greatest';

function getNextPrayer(now: Date) {
  const cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  for (let i = 0; i < PRAYERS.length; i++) {
    const [h, m] = PRAYERS[i].time.split(':').map(Number);
    if (cur < h * 3600 + m * 60) return { idx: i, secondsLeft: h * 3600 + m * 60 - cur };
  }
  const [h, m] = PRAYERS[0].time.split(':').map(Number);
  return { idx: 0, secondsLeft: 86400 - cur + h * 3600 + m * 60 };
}

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

const ROMAN = ['I','II','III','IV','V','VI'];

export function ModernMinimal() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const { idx: nextIdx, secondsLeft } = getNextPrayer(now);
  const nextPrayer = PRAYERS[nextIdx];

  const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'long', year:'numeric' }).format(now);
  const greg = new Intl.DateTimeFormat('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(now);
  const clockFmt = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  return (
    <div className="font-inter min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#faf8f4', color: '#1a1a1a' }}>

      {/* Top gold accent line */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #c9a227, #f0d060, #c9a227)' }} />

      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #e8e0d0' }}>
        <div>
          <h1 className="font-amiri font-bold" style={{ fontSize: '1.75rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Al Faruk Moschee
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Am Kanal 61 · Potsdam
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="font-amiri text-lg" style={{ color: '#c9a227' }}>{hijri}</div>
          <div className="text-xs" style={{ color: '#999', letterSpacing: '0.05em' }}>{greg}</div>
        </div>
        <div className="font-mono text-3xl font-light" style={{ color: '#1a1a1a' }}>{clockFmt}</div>
      </header>

      {/* Next Prayer HERO */}
      <div className="px-8 py-10 flex flex-col items-center text-center gap-4 relative"
        style={{ borderBottom: '1px solid #e8e0d0', background: '#f5f0e8' }}>
        
        {/* Gold geometric accent */}
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <svg width="120" height="24" viewBox="0 0 120 24" fill="none">
            <line x1="0" y1="1" x2="45" y2="1" stroke="#c9a227" strokeWidth="0.5" />
            <polygon points="60,2 52,18 68,18" fill="none" stroke="#c9a227" strokeWidth="0.8" />
            <line x1="75" y1="1" x2="120" y2="1" stroke="#c9a227" strokeWidth="0.5" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-[0.4em]" style={{ color: '#c9a227' }}>
          Next Prayer
        </p>

        <div className="font-amiri font-bold" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', color: '#1a1a1a', lineHeight: 1.1 }}>
          {nextPrayer.nameAr}
        </div>
        <div className="text-base uppercase tracking-[0.3em]" style={{ color: '#666', fontWeight: 300 }}>
          {nextPrayer.name}
        </div>

        <div className="font-mono font-thin" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: '#1a1a1a', letterSpacing: '0.05em' }}>
          {fmt(secondsLeft)}
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <svg width="120" height="24" viewBox="0 0 120 24" fill="none">
            <line x1="0" y1="23" x2="45" y2="23" stroke="#c9a227" strokeWidth="0.5" />
            <polygon points="60,22 52,6 68,6" fill="none" stroke="#c9a227" strokeWidth="0.8" />
            <line x1="75" y1="23" x2="120" y2="23" stroke="#c9a227" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* Prayer Times — clean typographic list */}
      <div className="flex-1 px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
            {PRAYERS.map((p, i) => {
              const isNext = i === nextIdx;
              const isPast = i < nextIdx;
              return (
                <div key={p.name} className="flex flex-col py-5 px-4 gap-1 relative"
                  style={{
                    borderRight: (i % 3 !== 2) ? '1px solid #e8e0d0' : 'none',
                    borderBottom: (i < 3) ? '1px solid #e8e0d0' : 'none',
                    background: isNext ? 'rgba(201,162,39,0.06)' : 'transparent',
                  }}>
                  {isNext && <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: '#c9a227' }} />}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest" style={{ color: '#bbb', fontWeight: 300 }}>
                      {ROMAN[i]}
                    </span>
                    {isNext && <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: '#c9a227', color: '#fff', fontWeight: 600, fontSize: '0.6rem' }}>NEXT</span>}
                    {isPast && <span className="text-xs" style={{ color: '#ccc' }}>✓</span>}
                  </div>

                  <div className="font-amiri font-bold text-xl leading-none"
                    style={{ color: isNext ? '#c9a227' : isPast ? '#ccc' : '#1a1a1a' }}>
                    {p.nameAr}
                  </div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: '#999', fontWeight: 300 }}>
                    {p.name}
                  </div>
                  <div className="font-mono text-lg font-medium mt-1"
                    style={{ color: isNext ? '#1a1a1a' : isPast ? '#ccc' : '#444' }}>
                    {p.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tickers */}
      <div className="mt-auto">
        <div className="py-2 px-6 flex overflow-hidden whitespace-nowrap"
          style={{ background: '#c9a227', color: '#fff' }}>
          <span className="font-semibold text-sm shrink-0 mr-4 uppercase tracking-widest">News</span>
          <div className="flex-1 overflow-hidden">
            <div className="inline-block animate-marquee text-sm">{NEWS + '  •  ' + NEWS}</div>
          </div>
        </div>
        <div className="py-3 px-6 flex overflow-hidden whitespace-nowrap"
          style={{ background: '#f5f0e8', borderTop: '1px solid #e8e0d0' }}>
          <span className="font-semibold shrink-0 mr-4 text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>Daily Dhikr</span>
          <div className="flex-1 overflow-hidden">
            <div className="inline-block animate-marquee text-sm font-amiri" style={{ color: '#666' }}>{DHIKR + '  ✦  ' + DHIKR}</div>
          </div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #c9a227, #f0d060, #c9a227)' }} />
    </div>
  );
}
