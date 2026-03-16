import './_group.css';
import { useEffect, useState } from 'react';

const PRAYERS = [
  { name: 'Fajr',    nameAr: 'الفجر',    time: '04:26', mins: 266 },
  { name: 'Shuruk',  nameAr: 'الشروق',   time: '06:16', mins: 376 },
  { name: 'Dhuhr',   nameAr: 'الظهر',    time: '12:22', mins: 742 },
  { name: 'Asr',     nameAr: 'العصر',    time: '15:29', mins: 929 },
  { name: 'Maghrib', nameAr: 'المغرب',   time: '18:18', mins: 1098 },
  { name: 'Isha',    nameAr: 'العشاء',   time: '20:01', mins: 1201 },
];

const SKY_THEMES: Record<string, { bg: string; accent: string; text: string }> = {
  Fajr:    { bg: 'linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #ff6e7f 100%)', accent: '#ffb3ba', text: '#fff' },
  Shuruk:  { bg: 'linear-gradient(to bottom, #ff6e7f 0%, #fda085 50%, #f6d365 100%)', accent: '#fff3cd', text: '#1a0800' },
  Dhuhr:   { bg: 'linear-gradient(to bottom, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)', accent: '#fff', text: '#003366' },
  Asr:     { bg: 'linear-gradient(to bottom, #1e3c72 0%, #2a5298 50%, #f9a825 100%)', accent: '#ffd54f', text: '#fff' },
  Maghrib: { bg: 'linear-gradient(to bottom, #1a1a2e 0%, #c62828 40%, #ff8f00 100%)', accent: '#ffcc80', text: '#fff' },
  Isha:    { bg: 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a3e 60%, #0d0d2b 100%)', accent: '#c5cae9', text: '#e8eaf6' },
};

const NEWS = 'صلاة الجمعة الساعة 1:00 ظهراً • دروس القرآن كل سبت • حلقة الدراسات الإسلامية كل أحد';

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
  return { h: String(h).padStart(2,'0'), m: String(m).padStart(2,'0'), s: String(sec).padStart(2,'0') };
}

export function SkyTimeline() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const { idx: nextIdx, secondsLeft } = getNextPrayer(now);
  const nextPrayer = PRAYERS[nextIdx];
  const currentIdx = nextIdx === 0 ? PRAYERS.length - 1 : nextIdx - 1;
  const theme = SKY_THEMES[PRAYERS[currentIdx].name] || SKY_THEMES.Isha;
  const { h, m, s } = fmt(secondsLeft);

  const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'long', year:'numeric' }).format(now);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const progress = Math.max(0, Math.min(100, (nowMins / 1440) * 100));

  return (
    <div className="font-inter min-h-screen flex flex-col relative overflow-hidden" style={{ background: theme.bg, color: theme.text }}>

      {/* Stars for night */}
      {(currentIdx === PRAYERS.length - 1 || currentIdx === 0) && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: Math.random()*2+1+'px', height: Math.random()*2+1+'px', top: Math.random()*60+'%', left: Math.random()*100+'%', opacity: Math.random()*0.8+0.2 }} />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${theme.accent}30` }}>
        <div>
          <h1 className="font-amiri font-bold text-2xl">{PRAYERS[currentIdx].nameAr} — {PRAYERS[currentIdx].name}</h1>
          <p className="text-xs opacity-60">Al Faruk Moschee • Potsdam</p>
        </div>
        <div className="font-amiri text-lg font-bold opacity-80">{hijri}</div>
      </header>

      {/* Main: Timeline + Countdown */}
      <div className="relative z-10 flex flex-1 gap-0 min-h-0">

        {/* LEFT: Prayer Timeline */}
        <div className="w-[200px] shrink-0 flex flex-col justify-center px-6 py-4 gap-0 relative"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', borderRight: `1px solid ${theme.accent}20` }}>
          
          {/* Timeline line */}
          <div className="absolute left-[2.85rem] top-[10%] bottom-[10%] w-0.5 rounded-full opacity-30"
            style={{ background: theme.accent }} />
          
          {/* Progress indicator */}
          <div className="absolute left-[2.85rem] top-[10%] w-0.5 rounded-full"
            style={{ background: theme.accent, height: `${progress * 0.8}%` }} />

          {PRAYERS.map((p, i) => {
            const isNext = i === nextIdx;
            const isPast = i < nextIdx;
            return (
              <div key={p.name} className="flex items-center gap-3 py-2.5 relative z-10">
                <div className="w-3 h-3 rounded-full shrink-0 relative z-20 transition-all"
                  style={{
                    background: isNext ? theme.accent : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${theme.accent}`,
                    boxShadow: isNext ? `0 0 12px ${theme.accent}` : 'none',
                    transform: isNext ? 'scale(1.4)' : 'scale(1)',
                  }} />
                <div>
                  <div className="font-amiri text-sm font-bold leading-none"
                    style={{ color: isNext ? theme.accent : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)' }}>
                    {p.nameAr}
                  </div>
                  <div className="font-mono text-xs mt-0.5 opacity-70">{p.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Countdown */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-xs uppercase tracking-[0.4em] opacity-50">
            Next • {nextPrayer.name}
          </p>
          <p className="font-amiri text-4xl font-bold" style={{ color: theme.accent }}>
            {nextPrayer.nameAr}
          </p>

          {/* Large segmented display */}
          <div className="flex items-center gap-2">
            {[h, m, s].map((unit, ui) => (
              <>
                <div key={ui} className="flex flex-col items-center">
                  <div className="font-mono font-black rounded-xl px-3 py-2 text-center min-w-[70px]"
                    style={{
                      fontSize: 'clamp(2rem, 8vw, 4rem)',
                      background: 'rgba(0,0,0,0.4)',
                      border: `1px solid ${theme.accent}40`,
                      color: theme.accent,
                      textShadow: `0 0 20px ${theme.accent}`,
                      backdropFilter: 'blur(4px)',
                    }}>
                    {unit}
                  </div>
                  <div className="text-xs opacity-40 mt-1">{['HRS','MIN','SEC'][ui]}</div>
                </div>
                {ui < 2 && <div className="font-mono font-black text-4xl opacity-60 pb-5" style={{ color: theme.accent }}>:</div>}
              </>
            ))}
          </div>

          {/* Day arc */}
          <div className="w-full max-w-xs mt-4">
            <div className="text-xs uppercase tracking-widest opacity-40 text-center mb-2">Day Progress</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${theme.accent}80, ${theme.accent})` }} />
            </div>
            <div className="flex justify-between text-xs opacity-40 mt-1">
              <span>الفجر</span><span>الشروق</span><span>الظهر</span><span>العصر</span><span>المغرب</span><span>العشاء</span>
            </div>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="relative z-10 py-2 px-4 flex overflow-hidden whitespace-nowrap"
        style={{ background: `${theme.accent}cc`, color: theme.text === '#fff' ? '#111' : theme.text }}>
        <span className="font-bold text-sm shrink-0 mr-4">أخبار:</span>
        <div className="flex-1 overflow-hidden">
          <div className="inline-block animate-marquee text-sm">{NEWS + '  •  ' + NEWS}</div>
        </div>
      </div>
    </div>
  );
}
