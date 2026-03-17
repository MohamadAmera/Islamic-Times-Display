import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrayerContext } from '@/context/PrayerContext';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

const MECCA_LAT = 21.422487;
const MECCA_LNG = 39.826206;
const MOSQUE_LAT = 52.3963;
const MOSQUE_LNG = 13.0541;

type Stage = 'requesting' | 'locating' | 'ar' | 'compass' | 'error';

function calcQibla(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const λ2 = (MECCA_LNG * Math.PI) / 180;
  const y = Math.sin(λ2 - λ1);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(λ2 - λ1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function calcDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const Δφ = ((MECCA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((MECCA_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DIRS_AR: Record<string, string> = {
  NO: 'ش.ش', O: 'ش', SO: 'ج.ش', S: 'ج', SW: 'ج.غ', W: 'غ', NW: 'ش.غ',
};
const COMPASS_DIRS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];

export default function Qibla() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';

  const [stage, setStage] = useState<Stage>('requesting');
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const vibratedRef = useRef(false);

  const headingDiff =
    qiblaAngle !== null
      ? ((qiblaAngle - heading + 540) % 360) - 180
      : null;
  const isAligned = headingDiff !== null && Math.abs(headingDiff) < 10;

  useEffect(() => {
    if (isAligned && !vibratedRef.current) {
      vibratedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(200);
    } else if (!isAligned) {
      vibratedRef.current = false;
    }
  }, [isAligned]);

  const listenOrientation = useCallback(() => {
    const handler = (e: Event) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let alpha: number | null = null;
      if (ev.webkitCompassHeading != null) {
        alpha = ev.webkitCompassHeading;
      } else if (ev.absolute && ev.alpha != null) {
        alpha = 360 - ev.alpha;
      } else if (ev.alpha != null) {
        alpha = 360 - ev.alpha;
      }
      if (alpha !== null) setHeading(alpha);
    };
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    cleanupRef.current = () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  const requestOrientation = useCallback(() => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((r) => { if (r === 'granted') listenOrientation(); })
        .catch(() => listenOrientation());
    } else {
      listenOrientation();
    }
  }, [listenOrientation]);

  const resolveLocation = useCallback(
    (cameraOk: boolean) => {
      setStage('locating');

      const applyLoc = (lat: number, lng: number, fallback: boolean) => {
        setQiblaAngle(calcQibla(lat, lng));
        setDistance(calcDistance(lat, lng));
        setUsedFallback(fallback);
        setGpsLoading(false);
      };

      // Show compass immediately with mosque default, then upgrade via GPS
      applyLoc(MOSQUE_LAT, MOSQUE_LNG, true);
      setStage(cameraOk ? 'ar' : 'compass');
      requestOrientation();

      if (navigator.geolocation) {
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => applyLoc(pos.coords.latitude, pos.coords.longitude, false),
          () => { setGpsLoading(false); /* keep mosque fallback */ },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      }
    },
    [requestOrientation],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // requesting-permissions phase: camera + orientation initiated together
      let cameraOk = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!cancelled) {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          cameraOk = true;
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        /* camera denied or unavailable → fall through to compass mode */
      }

      if (!cancelled) {
        try {
          resolveLocation(cameraOk);
        } catch {
          setStage('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanupRef.current?.();
    };
  }, []);

  const arrowRotation = qiblaAngle !== null ? qiblaAngle - heading : 0;
  const roseRotation = -heading;

  const isAR = stage === 'ar';
  const isReady = stage === 'ar' || stage === 'compass';

  if (stage === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a211d] flex flex-col items-center justify-center gap-6 px-8 text-center">
        <AlertCircle className="text-red-400" size={52} />
        <p className="text-foreground text-base font-semibold">
          {isAr
            ? 'تعذّر تشغيل البوصلة. تأكد من دعم المتصفح لمستشعرات الاتجاه.'
            : 'Kompass konnte nicht gestartet werden. Bitte Sensorrechte prüfen.'}
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: '#d6a93e', color: '#1a211d' }}
        >
          {isAr ? 'رجوع' : 'Zurück'}
        </Link>
      </div>
    );
  }

  const backBtn = (
    <Link
      href="/"
      className="absolute z-30 flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
      style={{
        top: 'max(0.9rem, env(safe-area-inset-top))',
        [isAr ? 'right' : 'left']: '1rem',
      }}
    >
      <ArrowLeft
        size={22}
        style={isAr ? { transform: 'scaleX(-1)' } : undefined}
      />
      <span className="text-sm font-semibold">{isAr ? 'رجوع' : 'Zurück'}</span>
    </Link>
  );

  if (!isReady) {
    const loadingText = stage === 'locating'
      ? (isAr ? 'جاري تحديد الموقع...' : 'Standort wird ermittelt...')
      : (isAr ? 'جاري تهيئة الكاميرا...' : 'Kamera wird gestartet...');
    return (
      <div className="fixed inset-0 z-50 bg-[#1a211d] flex flex-col items-center justify-center gap-5">
        <Loader2 className="text-primary animate-spin" size={52} />
        <p className="text-foreground text-base font-semibold">{loadingText}</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Camera (AR mode) ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isAR ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* ── Background (compass mode) ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isAR ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(160deg, #1a211d 0%, #2a322e 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #d6a93e 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      {/* ── Dim overlay for AR ── */}
      {isAR && <div className="absolute inset-0 bg-black/25" />}

      {backBtn}

      {/* ── Title ── */}
      <div className="absolute z-10 top-0 left-0 right-0 flex justify-center" style={{ top: 'max(0.9rem, env(safe-area-inset-top))' }}>
        <div
          className="px-4 py-1.5 rounded-xl text-sm font-bold text-primary"
          style={{ background: isAR ? 'rgba(0,0,0,0.45)' : 'transparent', backdropFilter: isAR ? 'blur(8px)' : 'none' }}
        >
          {isAr ? 'اتجاه القبلة' : 'Qibla-Richtung'}
        </div>
      </div>

      {/* ── Compass + Arrow ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: 'min(78vmin, 360px)',
            height: 'min(78vmin, 360px)',
            position: 'relative',
          }}
        >
          {/* Rotating compass rose */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: roseRotation }}
            transition={{ type: 'spring', stiffness: 55, damping: 13 }}
          >
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(214,169,62,0.35)' }}
            />
            {/* Tick marks */}
            {Array.from({ length: 72 }).map((_, i) => {
              const isCard = i % 18 === 0;
              const isMid = i % 9 === 0;
              const h = isCard ? 18 : isMid ? 11 : 6;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '2px',
                    height: `${h}px`,
                    top: 0,
                    left: '50%',
                    transformOrigin: `1px min(39vmin, 180px)`,
                    transform: `rotate(${i * 5}deg) translateX(-50%)`,
                    background: isCard ? '#d6a93e' : 'rgba(214,169,62,0.28)',
                    borderRadius: '1px',
                  }}
                />
              );
            })}
            {/* Cardinal labels */}
            {COMPASS_DIRS.map((dir, i) => {
              const angleDeg = i * 45;
              const r = 42;
              const x = 50 + r * Math.sin((angleDeg * Math.PI) / 180);
              const y = 50 - r * Math.cos((angleDeg * Math.PI) / 180);
              const isNorth = dir === 'N';
              const isCardinal = i % 2 === 0;
              const label = isAr && !isNorth ? (DIRS_AR[dir] ?? dir) : dir;
              return (
                <span
                  key={dir}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%,-50%)',
                    fontSize: isCardinal ? '0.8rem' : '0.6rem',
                    fontWeight: isNorth ? 800 : isCardinal ? 600 : 400,
                    color: isNorth ? '#f87171' : 'rgba(214,169,62,0.75)',
                  }}
                >
                  {label}
                </span>
              );
            })}
          </motion.div>

          {/* Inner filled circle */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '17%',
              background: isAR ? 'rgba(0,0,0,0.4)' : 'rgba(26,33,29,0.85)',
              border: '1px solid rgba(214,169,62,0.18)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Qibla arrow — always points toward Mecca */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: arrowRotation }}
            transition={{ type: 'spring', stiffness: 55, damping: 13 }}
          >
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <filter id="glow-gold">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-green">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <AnimatePresence>
                {isAligned ? (
                  <motion.g
                    key="green-arrow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    filter="url(#glow-green)"
                  >
                    <polygon points="50,18 44.5,32 55.5,32" fill="#22c55e" />
                    <rect x="47.5" y="32" width="5" height="22" fill="#22c55e" rx="2" />
                    <rect x="47.5" y="56" width="5" height="10" fill="rgba(34,197,94,0.35)" rx="2" />
                  </motion.g>
                ) : (
                  <motion.g
                    key="gold-arrow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    filter="url(#glow-gold)"
                  >
                    <polygon points="50,18 44.5,32 55.5,32" fill="#d6a93e" />
                    <rect x="47.5" y="32" width="5" height="22" fill="#d6a93e" rx="2" />
                    <rect x="47.5" y="56" width="5" height="10" fill="rgba(214,169,62,0.3)" rx="2" />
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
          </motion.div>

          {/* Center: Kaaba */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: isAligned ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="flex items-center justify-center rounded-xl overflow-hidden"
                style={{
                  width: '52px',
                  height: '52px',
                  background: 'rgba(0,0,0,0.7)',
                  border: `2px solid ${isAligned ? '#22c55e' : 'rgba(214,169,62,0.4)'}`,
                  boxShadow: isAligned
                    ? '0 0 24px rgba(34,197,94,0.55)'
                    : '0 0 14px rgba(214,169,62,0.25)',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              >
                <span style={{ fontSize: '32px', lineHeight: 1 }}>🕋</span>
              </div>
              <AnimatePresence>
                {isAligned && (
                  <motion.p
                    initial={{ opacity: 0, y: 4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-green-400 text-xs font-bold text-center"
                    style={{ textShadow: '0 0 8px rgba(34,197,94,0.8)' }}
                  >
                    {isAr ? 'اتجاه القبلة ✓' : 'Qibla ✓'}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-4"
        style={{ paddingBottom: 'max(1.2rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3"
          style={{
            background: isAR ? 'rgba(0,0,0,0.58)' : 'rgba(42,50,46,0.92)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(214,169,62,0.22)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <p
              className="text-primary font-bold text-base leading-tight"
              style={{ fontFamily: "'Amiri','Noto Naskh Arabic',serif" }}
            >
              {isAr ? 'الكعبة المشرفة' : 'Heilige Kaaba'}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr ? 'مكة المكرمة، المملكة العربية السعودية' : 'Mekka, Saudi-Arabien'}
            </p>
            {usedFallback && !gpsLoading && (
              <p className="text-yellow-400/70 text-xs">
                {isAr ? '* موقع المسجد كافتراضي' : '* Moschee-Standort als Standard'}
              </p>
            )}
            {gpsLoading && (
              <p className="text-blue-300/70 text-xs flex items-center gap-1">
                <Loader2 size={10} className="animate-spin shrink-0" />
                {isAr ? 'جارٍ تحديد الموقع…' : 'GPS wird ermittelt…'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {distance !== null && (
              <div className="text-center">
                <p className="text-foreground font-bold text-lg leading-none tabular-nums" dir="ltr">
                  {Math.round(distance).toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">km</p>
              </div>
            )}
            {qiblaAngle !== null && (
              <div className="text-center">
                <p className="text-primary font-bold text-lg leading-none tabular-nums" dir="ltr">
                  {Math.round(qiblaAngle)}°
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {isAr ? 'القبلة' : 'Richtung'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Green flash when aligned ── */}
      <AnimatePresence>
        {isAligned && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.18, 0] }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute inset-0 bg-green-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
