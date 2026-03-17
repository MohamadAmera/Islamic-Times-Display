import React from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { Monitor, Volume2, VolumeX, Settings, Compass } from 'lucide-react';
import { Link } from 'wouter';

export function Layout({ children }: { children: React.ReactNode }) {
  const { 
    language, toggleLanguage, 
    isTV, toggleTV, 
    athanEnabled, toggleAthan,
    prayerData 
  } = usePrayerContext();

  const isAr = language === 'ar';
  
  // Hijri Date Formatting
  const today = new Date();
  const hijriFormat = new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);
  
  const gregorianFormat = new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className={`p-4 md:p-6 flex items-center justify-between glass-panel border-x-0 border-t-0 z-20 ${isTV ? 'text-xl' : ''}`}>
        <div className="flex flex-col">
          <h1 className={`font-display font-bold text-2xl md:text-3xl lg:text-4xl text-primary drop-shadow-md`}>
            {isAr ? prayerData?.mosque?.nameAr || 'النور' : prayerData?.mosque?.name || 'Al-Noor'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base opacity-80">
            {isAr ? prayerData?.mosque?.addressAr : prayerData?.mosque?.address}
          </p>
        </div>

        <div className="flex flex-col items-center flex-1 hidden md:flex">
          <div className="text-xl md:text-2xl font-bold text-foreground drop-shadow">{hijriFormat}</div>
          <div className="text-sm md:text-base text-muted-foreground">{gregorianFormat}</div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/qibla" className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-primary transition-colors cursor-pointer" title="Qibla Compass">
            <Compass size={isTV ? 32 : 24} />
          </Link>
          
          <button onClick={toggleAthan} className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-primary transition-colors" title="Toggle Athan">
            {athanEnabled ? <Volume2 size={isTV ? 32 : 24} /> : <VolumeX size={isTV ? 32 : 24} className="opacity-50" />}
          </button>
          
          <Link href="/tv" className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-primary transition-colors hidden lg:block cursor-pointer" title="TV Mode">
            <Monitor size={24} />
          </Link>
          
          <button 
            onClick={toggleLanguage} 
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors uppercase"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          
          <Link href="/admin" className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-muted-foreground transition-colors cursor-pointer">
            <Settings size={isTV ? 32 : 24} />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 z-10 overflow-hidden relative">
        {children}
      </main>

      {/* Bottom Tickers */}
      <div className="mt-auto z-20">
        {prayerData?.news && prayerData.news.length > 0 && (
          <div className="bg-primary/90 text-primary-foreground py-2 md:py-3 px-4 flex overflow-hidden whitespace-nowrap border-y border-white/20">
            <div className={`font-semibold flex items-center shrink-0 mr-4 ${isTV ? 'text-2xl' : ''}`}>
              {isAr ? 'أخبار:' : 'NEWS:'}
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center" dir="ltr">
              <div className={`inline-block animate-marquee whitespace-nowrap ${isTV ? 'text-2xl' : 'text-sm md:text-base'}`}>
                <span dir={isAr ? 'rtl' : 'ltr'} style={{ unicodeBidi: 'isolate' }}>
                  {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
                </span>
                <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                <span dir={isAr ? 'rtl' : 'ltr'} style={{ unicodeBidi: 'isolate' }}>
                  {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {prayerData?.azkar && prayerData.azkar.length > 0 && (
          <div className="glass-panel border-x-0 border-b-0 py-3 md:py-5 px-4 flex overflow-hidden whitespace-nowrap">
            <div className={`text-primary font-bold flex items-center shrink-0 mr-4 ${isTV ? 'text-3xl' : 'text-lg'}`}>
              {isAr ? 'حديث:' : 'HADITH:'}
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center" dir="ltr">
              <div className={`inline-block animate-marquee-slow whitespace-nowrap ${isTV ? 'text-3xl' : 'text-base md:text-lg'}`}>
                {prayerData.azkar.flatMap((a, i, arr) => [
                  <span key={`a-ar-${i}`} dir="rtl" style={{ unicodeBidi: 'isolate' }}>{a.hadith_ar}</span>,
                  <span key={`a-dot-${i}`}> · </span>,
                  <span key={`a-de-${i}`} dir="ltr">{a.hadith_de}</span>,
                  ...(i < arr.length - 1 ? [<span key={`a-div-${i}`}>&nbsp;&nbsp;✦&nbsp;&nbsp;</span>] : []),
                ])}
                <span>&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
                {prayerData.azkar.flatMap((a, i, arr) => [
                  <span key={`b-ar-${i}`} dir="rtl" style={{ unicodeBidi: 'isolate' }}>{a.hadith_ar}</span>,
                  <span key={`b-dot-${i}`}> · </span>,
                  <span key={`b-de-${i}`} dir="ltr">{a.hadith_de}</span>,
                  ...(i < arr.length - 1 ? [<span key={`b-div-${i}`}>&nbsp;&nbsp;✦&nbsp;&nbsp;</span>] : []),
                ])}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
