import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useGetPrayerData } from '@workspace/api-client-react';
import type { PrayerData, PrayerTime } from '@workspace/api-client-react';

type Language = 'en' | 'ar';

interface PrayerContextType {
  prayerData: PrayerData | undefined;
  isLoading: boolean;
  error: Error | null;
  language: Language;
  toggleLanguage: () => void;
  isTV: boolean;
  toggleTV: () => void;
  athanEnabled: boolean;
  toggleAthan: () => void;
  currentPrayerIndex: number;
  nextPrayerIndex: number;
  countdown: string;
  isAthanPlaying: boolean;
  themeClass: string;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const { data: prayerData, isLoading, error } = useGetPrayerData();
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('alnoor_lang') as Language) || 'en';
  });
  
  const [isTV, setIsTV] = useState(() => {
    return window.innerWidth >= 1600 || localStorage.getItem('alnoor_tv') === 'true';
  });
  
  const [athanEnabled, setAthanEnabled] = useState(() => {
    return localStorage.getItem('alnoor_athan') !== 'false';
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAthanPlaying, setIsAthanPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-detect TV on resize
  useEffect(() => {
    const handleResize = () => {
      if (localStorage.getItem('alnoor_tv') === null) {
        setIsTV(window.innerWidth >= 1600);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set body dir attribute for RTL
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('alnoor_lang', language);
  }, [language]);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
    audioRef.current.onended = () => setIsAthanPlaying(false);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Core Logic: Calculate current and next prayer
  const { currentPrayerIndex, nextPrayerIndex, timeUntilNext, themeClass } = useMemo(() => {
    if (!prayerData || !prayerData.prayers || prayerData.prayers.length === 0) {
      return { currentPrayerIndex: -1, nextPrayerIndex: -1, timeUntilNext: 0, themeClass: 'bg-theme-isha' };
    }

    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = currentMinutes * 60 + now.getSeconds();

    const prayers = prayerData.prayers.filter(p => p.enabled);
    if (prayers.length === 0) return { currentPrayerIndex: -1, nextPrayerIndex: -1, timeUntilNext: 0, themeClass: 'bg-theme-isha' };

    let currentIdx = prayers.length - 1; // Default to last prayer (Isha)
    let nextIdx = 0; // Default to first prayer (Fajr next day)
    let secondsToNext = 0;

    const prayerSeconds = prayers.map(p => {
      const [h, m] = p.time.split(':').map(Number);
      return (h * 60 + m) * 60;
    });

    for (let i = 0; i < prayerSeconds.length; i++) {
      if (currentSeconds < prayerSeconds[i]) {
        currentIdx = i === 0 ? prayers.length - 1 : i - 1;
        nextIdx = i;
        secondsToNext = prayerSeconds[i] - currentSeconds;
        break;
      }
    }

    // If we are past the last prayer
    if (currentSeconds >= prayerSeconds[prayerSeconds.length - 1]) {
      currentIdx = prayers.length - 1;
      nextIdx = 0;
      secondsToNext = (24 * 3600 - currentSeconds) + prayerSeconds[0];
    }

    // Determine theme
    const currentName = prayers[currentIdx]?.name?.toLowerCase() || 'isha';
    let theme = 'bg-theme-isha';
    if (currentName.includes('fajr')) theme = 'bg-theme-fajr';
    else if (currentName.includes('sun')) theme = 'bg-theme-sunrise';
    else if (currentName.includes('dhuhr') || currentName.includes('zuhr')) theme = 'bg-theme-dhuhr';
    else if (currentName.includes('asr')) theme = 'bg-theme-asr';
    else if (currentName.includes('maghrib')) theme = 'bg-theme-maghrib';

    return { currentPrayerIndex: currentIdx, nextPrayerIndex: nextIdx, timeUntilNext: secondsToNext, themeClass: theme };
  }, [prayerData, currentTime]);

  // Handle Athan triggering
  useEffect(() => {
    if (timeUntilNext === 0 && currentPrayerIndex !== -1 && athanEnabled) {
      // Don't play for sunrise
      const currentName = prayerData?.prayers?.[currentPrayerIndex]?.name?.toLowerCase();
      if (currentName && !currentName.includes('sun')) {
        setIsAthanPlaying(true);
        audioRef.current?.play().catch(e => console.log('Autoplay prevented:', e));
        
        // Notification
        if (Notification.permission === 'granted') {
          new Notification('Al Faruk Moschee - Gebetszeiten', {
            body: `It is time for ${prayerData?.prayers?.[currentPrayerIndex]?.name} prayer.`,
            icon: '/favicon.svg'
          });
        }
      }
    }
  }, [timeUntilNext, currentPrayerIndex, athanEnabled, prayerData]);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Format countdown
  const h = Math.floor(timeUntilNext / 3600);
  const m = Math.floor((timeUntilNext % 3600) / 60);
  const s = timeUntilNext % 60;
  const countdown = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const toggleLanguage = () => setLanguage(l => l === 'en' ? 'ar' : 'en');
  const toggleTV = () => {
    const newTV = !isTV;
    setIsTV(newTV);
    localStorage.setItem('alnoor_tv', String(newTV));
  };
  const toggleAthan = () => {
    const newAthan = !athanEnabled;
    setAthanEnabled(newAthan);
    localStorage.setItem('alnoor_athan', String(newAthan));
    if (!newAthan && isAthanPlaying) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setIsAthanPlaying(false);
    }
  };

  return (
    <PrayerContext.Provider value={{
      prayerData, isLoading, error,
      language, toggleLanguage,
      isTV, toggleTV,
      athanEnabled, toggleAthan,
      currentPrayerIndex, nextPrayerIndex, countdown,
      isAthanPlaying, themeClass
    }}>
      <div className={`min-h-screen w-full transition-colors duration-1000 ${themeClass} relative`}>
        {themeClass === 'bg-theme-isha' && <div className="absolute inset-0 stars pointer-events-none" />}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern.png)`, backgroundSize: '400px' }}
        />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </div>
    </PrayerContext.Provider>
  );
}

export function usePrayerContext() {
  const context = useContext(PrayerContext);
  if (context === undefined) {
    throw new Error('usePrayerContext must be used within a PrayerProvider');
  }
  return context;
}
