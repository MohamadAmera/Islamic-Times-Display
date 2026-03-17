import React, { useState } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { Monitor, Volume2, VolumeX, Settings, Compass, Menu, X } from 'lucide-react';
import { Link } from 'wouter';

export function Layout({ children }: { children: React.ReactNode }) {
  const { 
    language, toggleLanguage, 
    isTV, toggleTV, 
    athanEnabled, toggleAthan,
    prayerData 
  } = usePrayerContext();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAr = language === 'ar';
  
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
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className={`p-3 md:p-6 flex items-center justify-between glass-panel border-x-0 border-t-0 z-20 shrink-0 ${isTV ? 'text-xl' : ''}`}>

        {/* Mobile: Hamburger + Mosque name */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-primary transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-primary drop-shadow-md truncate">
            {isAr ? prayerData?.mosque?.nameAr || 'مسجد الفاروق' : prayerData?.mosque?.name || 'Al Faruk Moschee'}
          </h1>
        </div>

        {/* Desktop: Full mosque info */}
        <div className="hidden md:flex flex-col">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-primary drop-shadow-md">
            {isAr ? prayerData?.mosque?.nameAr || 'مسجد الفاروق' : prayerData?.mosque?.name || 'Al Faruk Moschee'}
          </h1>
          <p className="text-muted-foreground text-base opacity-80">
            {isAr ? prayerData?.mosque?.addressAr : prayerData?.mosque?.address}
          </p>
        </div>

        {/* Desktop: Hijri + Gregorian dates */}
        <div className="hidden md:flex flex-col items-center flex-1">
          <div className="text-xl md:text-2xl font-bold text-foreground drop-shadow">{hijriFormat}</div>
          <div className="text-sm md:text-base text-muted-foreground">{gregorianFormat}</div>
        </div>

        {/* Mobile: Language toggle only */}
        <button 
          onClick={toggleLanguage} 
          className="md:hidden px-3 py-1.5 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors uppercase text-sm"
        >
          {isAr ? 'DE' : 'عربي'}
        </button>

        {/* Desktop: All icons */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/qibla" className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors cursor-pointer" title="Qibla Compass">
            <Compass size={isTV ? 32 : 24} />
          </Link>
          
          <button onClick={toggleAthan} className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors" title="Toggle Athan">
            {athanEnabled ? <Volume2 size={isTV ? 32 : 24} /> : <VolumeX size={isTV ? 32 : 24} className="opacity-50" />}
          </button>
          
          <Link href="/tv" className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors hidden lg:block cursor-pointer" title="TV Mode">
            <Monitor size={24} />
          </Link>
          
          <button 
            onClick={toggleLanguage} 
            className="px-4 py-2 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors uppercase"
          >
            {isAr ? 'DE' : 'عربي'}
          </button>
          
          <Link href="/admin" className="p-3 rounded-xl hover:bg-white/10 text-muted-foreground transition-colors cursor-pointer">
            <Settings size={isTV ? 32 : 24} />
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 left-0 h-full w-72 bg-[#2a322e] border-r border-primary/20 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-primary font-bold text-lg">
                {isAr ? 'القائمة' : 'Menü'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Drawer items */}
            <nav className="flex-1 flex flex-col gap-1 p-3">
              <button
                onClick={() => { toggleLanguage(); setDrawerOpen(false); }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                <span className="text-primary font-bold text-lg">🌐</span>
                <span className="font-semibold">{isAr ? 'Deutsch' : 'العربية'}</span>
              </button>

              <button
                onClick={() => { toggleAthan(); setDrawerOpen(false); }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                {athanEnabled ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} className="text-muted-foreground" />}
                <span className="font-semibold">{isAr ? 'الأذان' : 'Athan'}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${athanEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {athanEnabled ? (isAr ? 'مفعّل' : 'An') : (isAr ? 'معطّل' : 'Aus')}
                </span>
              </button>

              <Link
                href="/qibla"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 text-foreground transition-colors cursor-pointer"
              >
                <Compass size={20} className="text-primary" />
                <span className="font-semibold">{isAr ? 'القبلة' : 'Qibla'}</span>
              </Link>

              <Link
                href="/tv"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 text-foreground transition-colors cursor-pointer"
              >
                <Monitor size={20} className="text-primary" />
                <span className="font-semibold">{isAr ? 'وضع التلفاز' : 'TV-Modus'}</span>
              </Link>
            </nav>

            {/* Drawer footer */}
            <div className="p-4 border-t border-white/10 text-center">
              <p className="text-muted-foreground text-xs opacity-60">
                {prayerData?.mosque?.address || 'Am Kanal 61, 14467 Potsdam'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 z-10 overflow-y-auto relative">
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
          isAr ? (
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
          ) : (
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
          )
        )}
      </div>
    </div>
  );
}
