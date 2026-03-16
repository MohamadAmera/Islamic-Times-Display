import './_group.css';
import { useEffect, useState } from 'react';

const PRAYERS = [
  { name: 'Fajr',    nameAr: 'الفجر',    time: '04:26', icon: '🌙' },
  { name: 'Shuruk',  nameAr: 'الشروق',   time: '06:16', icon: '🌅' },
  { name: 'Dhuhr',   nameAr: 'الظهر',    time: '12:22', icon: '☀️' },
  { name: 'Asr',     nameAr: 'العصر',    time: '15:29', icon: '🌤' },
  { name: 'Maghrib', nameAr: 'المغرب',   time: '18:18', icon: '🌆' },
  { name: 'Isha',    nameAr: 'العشاء',   time: '20:01', icon: '⭐' },
];

const NEWS = 'صلاة الجمعة - الساعة 1:00 ظهراً  •  دروس القرآن كل سبت صباحاً  •  حلقة الدراسات الإسلامية كل أحد';
const DHIKR = 'سُبْحَانَ اللَّهِ (رواه البخاري ومسلم)  ✦  الْحَمْدُ لِلَّهِ (رواه مسلم)  ✦  اللَّهُ أَكْبَرُ';

function getNextPrayer(now: Date) {
  const cur = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  for (let i = 0; i < PRAYERS.length; i++) {
    const [h, m] = PRAYERS[i].time.split(':').map(Number);
    const ps = h * 3600 + m * 60;
    if (cur < ps) return { idx: i, secondsLeft: ps - cur };
  }
  const [h, m] = PRAYERS[0].time.split(':').map(Number);
  const ps = h * 3600 + m * 60;
  return { idx: 0, secondsLeft: 86400 - cur + ps };
}

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export function EmeraldSanctuary() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const { idx: nextIdx, secondsLeft } = getNextPrayer(now);
  const nextPrayer = PRAYERS[nextIdx];

  const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'long', year:'numeric' }).format(now);
  const greg = new Intl.DateTimeFormat('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(now);

  return (
    <div className="font-inter min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a2218 0%, #0d2b1d 40%, #071a10 100%)', color: '#e8f0e9' }}>

      {/* Geometric overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%2310b981' stroke-width='1'/%3E%3Cpath d='M30 10L50 30L30 50L10 30Z' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px' }} />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(16,185,129,0.2)', background: 'rgba(10,34,24,0.6)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="font-amiri font-bold text-3xl" style={{ color: '#6ee7b7' }}>Al Faruk Moschee</h1>
          <p className="text-sm opacity-60" style={{ color: '#a7f3d0' }}>Am Kanal 61, 14467 Potsdam</p>
        </div>
        <div className="text-center hidden md:block">
          <div className="font-amiri text-xl font-bold" style={{ color: '#6ee7b7' }}>{hijri}</div>
          <div className="text-sm opacity-60">{greg}</div>
        </div>
        <div className="flex gap-3">
          <button className="px-3 py-1 rounded-lg font-bold text-sm" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>عربي</button>
          <button className="p-2 rounded-lg opacity-60 hover:opacity-100" style={{ color: '#6ee7b7' }}>⚙</button>
        </div>
      </header>

      {/* Countdown */}
      <div className="relative z-10 flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-xs uppercase tracking-[0.3em] opacity-50" style={{ color: '#a7f3d0' }}>
          Time remaining until {nextPrayer.name}
        </p>
        <div className="font-mono font-black animate-glow"
          style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', color: '#6ee7b7', textShadow: '0 0 40px rgba(110,231,183,0.5)', letterSpacing: '0.05em' }}>
          {fmt(secondsLeft)}
        </div>
        <div className="font-amiri text-2xl" style={{ color: '#a7f3d0' }}>{nextPrayer.nameAr}</div>
      </div>

      {/* Prayer Cards */}
      <div className="relative z-10 grid grid-cols-3 md:grid-cols-6 gap-3 px-4 pb-4">
        {PRAYERS.map((p, i) => {
          const isNext = i === nextIdx;
          return (
            <div key={p.name} className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
              style={{
                background: isNext ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.04)',
                border: isNext ? '2px solid rgba(110,231,183,0.6)' : '1px solid rgba(16,185,129,0.15)',
                boxShadow: isNext ? '0 0 30px rgba(16,185,129,0.2)' : 'none',
                backdropFilter: 'blur(10px)',
              }}>
              <span className="text-2xl">{p.icon}</span>
              <div className="font-amiri font-bold text-base" style={{ color: isNext ? '#6ee7b7' : '#a7f3d0' }}>{p.nameAr}</div>
              <div className="text-sm opacity-70" style={{ color: '#e8f0e9' }}>{p.name}</div>
              <div className="font-mono font-bold text-lg" style={{ color: isNext ? '#6ee7b7' : '#e8f0e9' }}>{p.time}</div>
              {isNext && <div className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{ background: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>NEXT</div>}
            </div>
          );
        })}
      </div>

      {/* Tickers */}
      <div className="mt-auto z-10">
        <div className="py-2 px-4 flex overflow-hidden whitespace-nowrap"
          style={{ background: 'rgba(16,185,129,0.85)', borderTop: '1px solid rgba(110,231,183,0.3)' }}>
          <span className="font-bold text-sm shrink-0 mr-4" style={{ color: '#022c22' }}>أخبار:</span>
          <div className="flex-1 overflow-hidden">
            <div className="inline-block animate-marquee text-sm" style={{ color: '#022c22' }}>{NEWS + '  •  ' + NEWS}</div>
          </div>
        </div>
        <div className="py-3 px-4 flex overflow-hidden whitespace-nowrap"
          style={{ background: 'rgba(10,34,24,0.95)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
          <span className="font-bold shrink-0 mr-4 text-sm" style={{ color: '#6ee7b7' }}>أذكار اليوم:</span>
          <div className="flex-1 overflow-hidden">
            <div className="inline-block animate-marquee text-sm font-amiri" style={{ color: '#a7f3d0' }}>{DHIKR + '  ✦  ' + DHIKR}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
