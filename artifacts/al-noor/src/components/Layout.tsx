import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { Monitor, Volume2, VolumeX, Settings, Compass, Menu, X, ExternalLink, Info, Newspaper, Calendar, Heart } from 'lucide-react';
import { Link } from 'wouter';
import type { PrayerData, NewsItem, HadithItem } from '@workspace/api-client-react';
import { NewsModal } from './NewsModal';

function computeContentHash(prayerData: PrayerData | null): string {
  if (!prayerData) return '';
  const newsItems: NewsItem[] = prayerData.news || [];
  const azkarItems: HadithItem[] = prayerData.azkar || [];
  if (newsItems.length === 0 && azkarItems.length === 0) return '';
  const newsText = newsItems.map((n) => n.text + n.textAr).join('|');
  const azkarText = azkarItems.map((a) => a.hadith_ar + a.hadith_de).join('|');
  let hash = 0;
  const str = newsText + '###' + azkarText;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}

const SEEN_HASH_KEY = 'alnoor_seen_content_hash';

export function Layout({ children }: { children: React.ReactNode }) {
  const { 
    language, toggleLanguage, 
    isTV, toggleTV, 
    athanEnabled, toggleAthan,
    prayerData 
  } = usePrayerContext();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const isAr = language === 'ar';

  const contentHash = useMemo(() => computeContentHash(prayerData), [prayerData]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!contentHash) return;
    const seen = localStorage.getItem(SEEN_HASH_KEY);
    const isUnread = seen !== contentHash;
    setHasUnread(isUnread);
    // Show news popup automatically if there's new unread news (not in TV mode)
    if (isUnread && (prayerData?.news?.length ?? 0) > 0 && !isTV) {
      setShowNewsModal(true);
    }
  }, [contentHash]);

  const closeNewsModal = useCallback(() => {
    setShowNewsModal(false);
    if (contentHash) {
      localStorage.setItem(SEEN_HASH_KEY, contentHash);
      setHasUnread(false);
    }
  }, [contentHash]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    if (contentHash) {
      localStorage.setItem(SEEN_HASH_KEY, contentHash);
      setHasUnread(false);
    }
  }, [contentHash]);

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

  const hasNews = (prayerData?.news?.length ?? 0) > 0;
  const hasAzkar = (prayerData?.azkar?.length ?? 0) > 0;
  const hasNotifications = hasNews || hasAzkar;

  return (
    <div className="flex flex-col h-dvh">
      {/* ═══ News Popup Modal ═══ */}
      {showNewsModal && prayerData?.news && prayerData.news.length > 0 && (
        <NewsModal
          news={prayerData.news}
          isAr={isAr}
          onClose={closeNewsModal}
        />
      )}

      {/* ═══ Mobile Header: only burger + small logo ═══ */}
      <header className="md:hidden flex items-center justify-between px-4 py-2 z-20 shrink-0 absolute top-0 left-0 right-0" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <button
          onClick={openDrawer}
          className="relative p-2 rounded-xl hover:bg-white/10 text-primary transition-colors"
        >
          <Menu size={26} />
          {hasNotifications && hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-background" />
          )}
        </button>
        <img
          src="/images/mosque-logo.png"
          alt="Al Faruk Moschee"
          className="h-9 w-9 object-contain opacity-80"
        />
      </header>

      {/* ═══ Desktop/TV Header: unchanged ═══ */}
      <header className={`hidden md:flex p-6 items-center justify-between glass-panel border-x-0 border-t-0 z-20 shrink-0 ${isTV ? 'text-xl' : ''}`}>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-primary drop-shadow-md">
            {isAr ? prayerData?.mosque?.nameAr || 'مسجد الفاروق' : prayerData?.mosque?.name || 'Al Faruk Moschee'}
          </h1>
          <p className="text-muted-foreground text-base opacity-80">
            {isAr ? prayerData?.mosque?.addressAr : prayerData?.mosque?.address}
          </p>
        </div>

        <div className="flex flex-col items-center flex-1">
          <div className="text-xl md:text-2xl font-bold text-foreground drop-shadow">{hijriFormat}</div>
          <div className="text-sm md:text-base text-muted-foreground">{gregorianFormat}</div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/qibla" className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors cursor-pointer" title="Qibla Compass">
            <Compass size={isTV ? 32 : 24} />
          </Link>
          <button onClick={toggleAthan} className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors" title="Toggle Athan">
            {athanEnabled ? <Volume2 size={isTV ? 32 : 24} /> : <VolumeX size={isTV ? 32 : 24} className="opacity-50" />}
          </button>
          <Link href="/tv" className="p-3 rounded-xl hover:bg-white/10 text-primary transition-colors hidden lg:block cursor-pointer" title="TV Mode">
            <Monitor size={24} />
          </Link>
          <button onClick={toggleLanguage} className="px-4 py-2 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors uppercase">
            {isAr ? 'DE' : 'عربي'}
          </button>
          <Link href="/admin" className="p-3 rounded-xl hover:bg-white/10 text-muted-foreground transition-colors cursor-pointer">
            <Settings size={isTV ? 32 : 24} />
          </Link>
        </div>
      </header>

      {/* ═══ Mobile Drawer ═══ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 left-0 h-full w-80 bg-[#2a322e] border-r border-primary/20 shadow-2xl flex flex-col overflow-y-auto"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header with logo */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <img src="/images/mosque-logo.png" alt="" className="h-10 w-10 object-contain" />
              <div className="flex-1">
                <h2 className="text-primary font-bold text-base leading-tight">
                  {isAr ? 'مسجد الفاروق' : 'Al Faruk Moschee'}
                </h2>
                <p className="text-muted-foreground text-xs opacity-70">
                  {isAr ? 'المسلمون في بوتسدام' : 'Muslime in Potsdam e.V'}
                </p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex flex-col gap-0.5 p-3">
              {/* External: Website */}
              <a
                href="https://www.islam-potsdam.de"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                <ExternalLink size={20} className="text-primary" />
                <span className="font-semibold text-sm">{isAr ? 'الصفحة الرئيسية' : 'Startseite'}</span>
              </a>

              {/* External: Über Uns */}
              <a
                href="https://www.islam-potsdam.de/ueber-uns/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                <Info size={20} className="text-primary" />
                <span className="font-semibold text-sm">{isAr ? 'من نحن' : 'Über Uns'}</span>
              </a>

              <div className="h-px bg-white/10 my-1" />

              {/* Language */}
              <button
                onClick={() => { toggleLanguage(); setDrawerOpen(false); }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                <span className="text-primary font-bold text-lg w-5 text-center">🌐</span>
                <span className="font-semibold text-sm">{isAr ? 'Deutsch' : 'العربية'}</span>
              </button>

              {/* Athan */}
              <button
                onClick={() => { toggleAthan(); setDrawerOpen(false); }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors"
              >
                {athanEnabled ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} className="text-muted-foreground" />}
                <span className="font-semibold text-sm">{isAr ? 'الأذان' : 'Athan'}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${athanEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {athanEnabled ? (isAr ? 'مفعّل' : 'An') : (isAr ? 'معطّل' : 'Aus')}
                </span>
              </button>

              {/* Qibla */}
              <Link
                href="/qibla"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors cursor-pointer"
              >
                <Compass size={20} className="text-primary" />
                <span className="font-semibold text-sm">{isAr ? 'القبلة' : 'Qibla'}</span>
              </Link>

              {/* TV */}
              <Link
                href="/tv"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors cursor-pointer"
              >
                <Monitor size={20} className="text-primary" />
                <span className="font-semibold text-sm">{isAr ? 'وضع التلفاز' : 'TV-Modus'}</span>
              </Link>

              <div className="h-px bg-white/10 my-1" />

              {/* Gebetszeiten des Monats */}
              <Link
                href="/monthly"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-foreground transition-colors cursor-pointer"
              >
                <Calendar size={20} className="text-primary" />
                <span className="font-semibold text-sm">{isAr ? 'مواقيت الشهر' : 'Monatszeiten'}</span>
              </Link>

              {/* Spenden — placeholder */}
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground/50 cursor-default">
                <Heart size={20} />
                <span className="font-semibold text-sm">{isAr ? 'التبرع' : 'Spenden'}</span>
                <span className="ml-auto text-xs bg-white/5 px-2 py-0.5 rounded-full">{isAr ? 'قريباً' : 'Bald'}</span>
              </div>
            </nav>

            {/* ═══ News & Hadiths section inside drawer ═══ */}
            {hasNotifications && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={16} className="text-primary" />
                  <h3 className="text-primary font-bold text-sm">
                    {isAr ? 'أخبار وأحاديث' : 'Nachrichten & Hadithe'}
                  </h3>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {hasNews && prayerData!.news.map((n, i) => (
                    <div key={`news-${i}`} className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-primary font-semibold mb-0.5">{isAr ? 'خبر' : 'Nachricht'}</p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {isAr ? n.textAr : n.text}
                      </p>
                    </div>
                  ))}

                  {hasAzkar && prayerData!.azkar.map((a, i) => (
                    <div key={`hadith-${i}`} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground font-semibold mb-0.5">{isAr ? 'حديث' : 'Hadith'}</p>
                      <p className="text-sm text-foreground leading-relaxed" style={isAr ? { direction: 'rtl' } : undefined}>
                        {isAr ? a.hadith_ar : a.hadith_de}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer footer */}
            <div className="mt-auto p-4 border-t border-white/10 text-center">
              <p className="text-muted-foreground text-xs opacity-60">
                Am Kanal 61, 14467 Potsdam
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Main Content Area ═══ */}
      <main className="flex-1 flex flex-col p-3 md:p-8 z-10 overflow-y-auto relative" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {children}
      </main>

      {/* ═══ Bottom Tickers — desktop/TV only ═══ */}
      <div className="hidden md:block shrink-0 z-20">
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
