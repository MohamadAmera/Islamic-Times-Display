import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { usePrayerContext } from '@/context/PrayerContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Compass, MapPin, AlertCircle } from 'lucide-react';

// Mecca coordinates
const MECCA_LAT = 21.422487;
const MECCA_LNG = 39.826206;

export default function Qibla() {
  const { language, isTV } = usePrayerContext();
  const isAr = language === 'ar';
  
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Calculate bearing to Mecca
  const calculateQibla = (lat: number, lng: number) => {
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    const meccaLatRad = MECCA_LAT * (Math.PI / 180);
    const meccaLngRad = MECCA_LNG * (Math.PI / 180);

    const y = Math.sin(meccaLngRad - lngRad);
    const x = Math.cos(latRad) * Math.tan(meccaLatRad) - Math.sin(latRad) * Math.cos(meccaLngRad - lngRad);
    
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360;
    return bearing;
  };

  const getLocation = () => {
    setIsLocating(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError(isAr ? "الموقع غير مدعوم في متصفحك" : "Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const angle = calculateQibla(position.coords.latitude, position.coords.longitude);
        setQiblaAngle(angle);
        setIsLocating(false);
        
        // Request device orientation if available
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          (DeviceOrientationEvent as any).requestPermission()
            .then((responseState: string) => {
              if (responseState === 'granted') {
                window.addEventListener('deviceorientationabsolute', handleOrientation, true);
              }
            })
            .catch(console.error);
        } else {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        }
      },
      (err) => {
        setError(isAr ? "فشل في الحصول على الموقع. يرجى تفعيل الصلاحيات." : "Failed to get location. Please enable permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleOrientation = (event: any) => {
    let alpha = event.alpha; // Compass direction
    if (event.webkitCompassHeading) {
      alpha = event.webkitCompassHeading; // iOS
    } else if (alpha !== null) {
      alpha = 360 - alpha; // Android
    }
    if (alpha !== null) {
      setHeading(alpha);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    };
  }, []);

  // Calculate compass rotation
  // The compass rose rotates based on phone heading
  // The Qibla arrow rotates to point to Qibla relative to the compass
  const compassRotation = heading !== null ? -heading : 0;
  const arrowRotation = qiblaAngle !== null ? qiblaAngle : 0;

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className={`font-display font-bold text-primary mb-4 ${isTV ? 'text-6xl' : 'text-4xl'}`}>
            {isAr ? 'اتجاه القبلة' : 'Qibla Direction'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAr ? 'اضغط أدناه لتحديد موقعك ومعرفة اتجاه القبلة' : 'Tap below to find your location and Qibla direction'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/20 text-destructive border border-destructive/50 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        <div className={`relative ${isTV ? 'w-96 h-96' : 'w-72 h-72'} mb-12`}>
          {/* Compass Background/Rose */}
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-primary/30 flex items-center justify-center glass-panel"
            animate={{ rotate: compassRotation }}
            transition={{ type: "spring", stiffness: 50, damping: 10 }}
          >
            <div className="absolute top-2 text-primary font-bold">N</div>
            <div className="absolute bottom-2 text-primary/50 font-bold">S</div>
            <div className="absolute right-2 text-primary/50 font-bold">E</div>
            <div className="absolute left-2 text-primary/50 font-bold">W</div>
            
            {/* Degree ticks */}
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-1 h-full py-2"
                style={{ transform: `rotate(${i * 30}deg)` }}
              >
                <div className={`w-full h-3 ${i === 0 ? 'bg-primary' : 'bg-primary/20'} rounded-full`} />
              </div>
            ))}
          </motion.div>

          {/* Qibla Arrow */}
          {qiblaAngle !== null && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ rotate: arrowRotation }}
            >
              <div className="w-1 h-1/2 bg-transparent absolute top-0 flex flex-col items-center justify-start origin-bottom">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-primary -mt-6 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                <div className="w-2 h-1/2 bg-primary rounded-full" />
              </div>
            </motion.div>
          )}

          {/* Kaaba Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-16 h-16 rounded-xl bg-black border-2 border-primary/50 flex items-center justify-center overflow-hidden shadow-2xl">
               <img src={`${import.meta.env.BASE_URL}images/kaaba.png`} alt="Kaaba" className="w-full h-full object-cover opacity-80" />
             </div>
          </div>
        </div>

        <Button 
          size="lg" 
          onClick={getLocation} 
          disabled={isLocating}
          className="w-full max-w-md text-lg"
        >
          <MapPin className="mr-2 h-5 w-5" />
          {isLocating 
            ? (isAr ? 'جاري التحديد...' : 'Locating...') 
            : (isAr ? 'تحديد موقعي' : 'Find My Location')
          }
        </Button>

        {qiblaAngle !== null && (
          <div className="mt-8 text-center text-muted-foreground glass-panel px-6 py-3 rounded-2xl">
            {isAr ? 'الزاوية:' : 'Angle:'} <strong className="text-foreground text-xl mx-2">{Math.round(qiblaAngle)}°</strong>
          </div>
        )}
      </div>
    </Layout>
  );
}
