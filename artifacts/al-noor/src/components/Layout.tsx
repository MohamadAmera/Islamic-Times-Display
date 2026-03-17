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
    <div className="flex flex-col h-screen overflow-hidden">
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
      <div className="shrink-0 z-20">
        {prayerData?.news && prayerData.news.length > 0 && (
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            className="bg-primary/90 text-primary-foreground py-1.5 px-4 flex overflow-hidden whitespace-nowrap border-y border-white/20"
          >
            <div className={`font-semibold flex items-center shrink-0 ${isAr ? 'ml-4' : 'mr-4'} ${isTV ? 'text-2xl' : ''}`}>
              {isAr ? ':أخبار' : 'NEWS:'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className={`inline-block whitespace-nowrap ${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} ${isTV ? 'text-2xl' : 'text-sm md:text-base'}`}>
                {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
                &nbsp;&nbsp;•&nbsp;&nbsp;
                {prayerData.news.map(n => isAr ? n.textAr : n.text).join('  •  ')}
              </div>
            </div>
          </div>
        )}

        {prayerData?.azkar && prayerData.azkar.length > 0 && (
          <>
            {/* Row 1: Arabic — RTL marquee, text enters from left and exits right */}
            <div
              dir="rtl"
              className={`glass-panel border-x-0 border-b-0 flex overflow-hidden whitespace-nowrap items-center
                ${isTV ? 'py-3 px-6' : 'py-1.5 px-4'}`}
            >
              <div className={`text-primary font-bold shrink-0 ml-4 ${isTV ? 'text-3xl' : 'text-base md:text-lg'}`}>
                :حديث
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={`inline-block animate-marquee-rtl-slow whitespace-nowrap ${isTV ? 'text-3xl' : 'text-sm md:text-base'}`}>
                  {prayerData.azkar.map(a => a.hadith_ar).join('  ✦  ')}
                  &nbsp;&nbsp;✦&nbsp;&nbsp;
                  {prayerData.azkar.map(a => a.hadith_ar).join('  ✦  ')}
                </div>
              </div>
            </div>

            {/* Row 2: German — LTR marquee, text enters from right and exits left */}
            <div
              dir="ltr"
              className={`glass-panel border-x-0 border-b-0 flex overflow-hidden whitespace-nowrap items-center
                ${isTV ? 'py-3 px-6' : 'py-1.5 px-4'}`}
            >
              <div className={`text-muted-foreground font-semibold shrink-0 mr-4 ${isTV ? 'text-2xl' : 'text-xs md:text-sm'}`}>
                HADITH:
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={`inline-block animate-marquee-slow whitespace-nowrap text-muted-foreground ${isTV ? 'text-2xl' : 'text-xs md:text-sm'}`}>
                  {prayerData.azkar.map(a => a.hadith_de).join('  ✦  ')}
                  &nbsp;&nbsp;✦&nbsp;&nbsp;
                  {prayerData.azkar.map(a => a.hadith_de).join('  ✦  ')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
