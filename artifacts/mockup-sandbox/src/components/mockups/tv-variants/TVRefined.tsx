import { useEffect, useState } from "react";

const PRAYERS = [
  { name: "Fadjr",   nameAr: "الفجر",   time: "04:26", iqama: "04:46", offset: 20 },
  { name: "Shuruk",  nameAr: "الشروق",  time: "06:16", iqama: null,    offset: 0  },
  { name: "Duhr",    nameAr: "الظهر",   time: "12:22", iqama: "12:32", offset: 10 },
  { name: "Assr",    nameAr: "العصر",   time: "15:29", iqama: "15:39", offset: 10 },
  { name: "Maghrib", nameAr: "المغرب",  time: "18:18", iqama: "18:23", offset: 5  },
  { name: "Ishaa",   nameAr: "العشاء",  time: "20:01", iqama: "20:11", offset: 10 },
];
const NEWS = [
  "صلاة الجمعة كل جمعة الساعة الواحدة ظهراً  ·  Jumu'ah Prayer every Friday at 1:00 PM",
  "دروس القرآن الكريم للأطفال كل يوم سبت  ·  Quran classes for children every Saturday 9–12 AM",
  "حلقة الدراسات الإسلامية كل يوم ثلاثاء  ·  Islamic studies circle every Tuesday after Isha",
];
const DHIKR = [
  "سبحان الله  ·  SubhanAllah — رواه البخاري ومسلم / Reported by Al-Bukhari and Muslim",
  "الحمد لله  ·  Alhamdulillah — رواه مسلم / Reported by Muslim",
  "الله أكبر  ·  Allahu Akbar — رواه البخاري / Reported by Al-Bukhari",
  "لا إله إلا الله  ·  La ilaha illa Allah — رواه البخاري ومسلم / Reported by Al-Bukhari and Muslim",
];

const NEXT_IDX = 0; // Fadjr is next (after Ishaa)
const NOW_IDX = 5;  // Ishaa is current

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function TVRefined() {
  const now = useClock();
  const hh = String(6).padStart(2, "0");
  const mm = String(22).padStart(2, "0");

  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const gregAr = now.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const gregEn = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hijriAr = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);
  const hijriEn = new Intl.DateTimeFormat("en-US-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(160deg, #1e2a24 0%, #2a322e 50%, #1a2820 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Outfit', sans-serif",
      position: "relative",
    }}>
      {/* Subtle dot grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(214,169,62,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* ── HEADER ── */}
      <header style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center", padding: "20px 40px",
        borderBottom: "1px solid rgba(214,169,62,0.2)",
        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(16px)",
        position: "relative", zIndex: 10,
      }}>
        {/* Left: mosque */}
        <div>
          <div style={{ fontSize: "clamp(1.3rem,2vw,2.2rem)", fontWeight: 800, color: "#d6a93e", lineHeight: 1.15, direction: "rtl" }}>
            مسجد الفاروق
          </div>
          <div style={{ fontSize: "clamp(0.85rem,1.1vw,1.3rem)", color: "rgba(214,169,62,0.55)", fontWeight: 600 }}>
            Al Faruk Moschee · Potsdam
          </div>
          <div style={{ fontSize: "clamp(0.7rem,0.85vw,0.95rem)", color: "#9ca19d", marginTop: 2 }}>
            Am Kanal 61, 14467 Potsdam
          </div>
        </div>

        {/* Center: clock */}
        <div style={{ textAlign: "center", padding: "0 32px" }}>
          <div style={{
            fontFamily: "'Outfit', monospace", fontWeight: 900, lineHeight: 1,
            fontSize: "clamp(3.5rem,6vw,6.5rem)", color: "#ffffff",
            letterSpacing: "0.04em", textShadow: "0 0 40px rgba(255,255,255,0.1)",
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: "clamp(0.75rem,0.9vw,1rem)", color: "#9ca19d", marginTop: 6, display: "flex", gap: 12, justifyContent: "center" }}>
            <span style={{ direction: "rtl" }}>{gregAr}</span>
            <span style={{ color: "rgba(214,169,62,0.3)" }}>|</span>
            <span>{gregEn}</span>
          </div>
        </div>

        {/* Right: Hijri + exit */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "clamp(1.1rem,1.6vw,1.9rem)", fontWeight: 700, color: "#d6a93e", direction: "rtl" }}>{hijriAr}</div>
          <div style={{ fontSize: "clamp(0.75rem,0.9vw,1rem)", color: "rgba(214,169,62,0.55)", marginTop: 2 }}>{hijriEn}</div>
          <button style={{
            marginTop: 8, fontSize: "0.78rem", padding: "4px 14px", borderRadius: 99,
            background: "rgba(214,169,62,0.1)", color: "#d6a93e",
            border: "1px solid rgba(214,169,62,0.3)", cursor: "pointer",
          }}>EXIT TV / عادي</button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", minHeight: 0, position: "relative", zIndex: 10 }}>

        {/* Left: Countdown */}
        <div style={{
          width: "35%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          padding: "2vw 2.5vw",
          borderRight: "1px solid rgba(214,169,62,0.15)",
          background: "rgba(0,0,0,0.15)",
        }}>
          {/* Current period */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", color: "#9ca19d", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>
              الوقت الحالي  ·  Current Period
            </div>
            <div style={{ fontSize: "clamp(1.4rem,2.5vw,3rem)", color: "#9ca19d", fontWeight: 600 }}>
              العشاء  <span style={{ fontSize: "55%", opacity: 0.6, fontFamily: "'Outfit', sans-serif" }}>Ishaa</span>
            </div>
          </div>

          {/* Thin gold rule */}
          <div style={{ width: 60, height: 1, background: "linear-gradient(to right, transparent, #d6a93e, transparent)" }} />

          {/* Next prayer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: "#9ca19d", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>
              الوقت المتبقي لـ  ·  Next Prayer
            </div>
            <div style={{ fontSize: "clamp(2.5rem,5vw,6rem)", fontWeight: 900, color: "#d6a93e", lineHeight: 1, direction: "rtl" }}>
              الفجر
            </div>
            <div style={{ fontSize: "clamp(0.9rem,1.4vw,1.6rem)", color: "rgba(214,169,62,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>
              FADJR
            </div>
          </div>

          {/* Countdown — single clean pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(214,169,62,0.08)",
            border: "1px solid rgba(214,169,62,0.3)",
            borderRadius: 20, padding: "16px 32px",
            marginTop: 8,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(3rem,6.5vw,8rem)", fontWeight: 900, color: "#ffffff", lineHeight: 1, fontFamily: "'Outfit', monospace", letterSpacing: "-0.02em" }}>
                {hh}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#9ca19d", letterSpacing: "0.15em", marginTop: 4 }}>
                ساعة · HRS
              </div>
            </div>

            <div style={{ fontSize: "clamp(2.5rem,5vw,6rem)", fontWeight: 900, color: "rgba(214,169,62,0.5)", lineHeight: 1, marginBottom: 20 }}>:</div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(3rem,6.5vw,8rem)", fontWeight: 900, color: "#ffffff", lineHeight: 1, fontFamily: "'Outfit', monospace", letterSpacing: "-0.02em" }}>
                {mm}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#9ca19d", letterSpacing: "0.15em", marginTop: 4 }}>
                دقيقة · MIN
              </div>
            </div>
          </div>

          {/* Adhan time display */}
          <div style={{ fontSize: "clamp(1.1rem,1.8vw,2.2rem)", color: "rgba(255,255,255,0.35)", fontFamily: "'Outfit', monospace", letterSpacing: "0.1em" }}>
            04:26
          </div>
        </div>

        {/* Right: Prayer grid */}
        <div style={{ flex: 1, padding: "2.5vw 3vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 16, height: "100%" }}>
            {PRAYERS.map((p, idx) => {
              const isNext = idx === NEXT_IDX;
              const isCurrent = idx === NOW_IDX;
              const isPast = idx > NOW_IDX && !isNext;

              return (
                <div key={p.name} style={{
                  borderRadius: 18, padding: "20px 22px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  background: isNext
                    ? "linear-gradient(135deg, rgba(214,169,62,0.2) 0%, rgba(214,169,62,0.08) 100%)"
                    : isCurrent
                      ? "rgba(156,161,157,0.1)"
                      : "rgba(42,50,46,0.9)",
                  border: isNext
                    ? "1.5px solid rgba(214,169,62,0.6)"
                    : isCurrent
                      ? "1px solid rgba(156,161,157,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isNext ? "0 0 32px rgba(214,169,62,0.15), inset 0 1px 0 rgba(214,169,62,0.2)" : "none",
                  opacity: isPast ? 0.4 : 1,
                  backdropFilter: "blur(10px)",
                  transition: "all 0.5s",
                }}>
                  {/* Top: Name + badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "clamp(1.5rem,2.3vw,3rem)", fontWeight: 800, color: isNext ? "#d6a93e" : "#ffffff", lineHeight: 1.1, direction: "rtl" }}>
                        {p.nameAr}
                      </div>
                      <div style={{ fontSize: "clamp(0.7rem,0.85vw,1rem)", color: isNext ? "rgba(214,169,62,0.6)" : "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 3 }}>
                        {p.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      {isNext && (
                        <>
                          <span style={{ fontSize: "0.65rem", padding: "3px 10px", borderRadius: 99, background: "#d6a93e", color: "#1a2420", fontWeight: 800, letterSpacing: "0.12em" }}>NEXT</span>
                          <span style={{ fontSize: "0.65rem", padding: "3px 10px", borderRadius: 99, background: "rgba(214,169,62,0.15)", color: "#d6a93e", fontWeight: 700 }}>التالي</span>
                        </>
                      )}
                      {isCurrent && !isNext && (
                        <>
                          <span style={{ fontSize: "0.65rem", padding: "3px 10px", borderRadius: 99, background: "rgba(156,161,157,0.25)", color: "#9ca19d", fontWeight: 800, letterSpacing: "0.12em" }}>NOW</span>
                          <span style={{ fontSize: "0.65rem", padding: "3px 10px", borderRadius: 99, background: "rgba(156,161,157,0.1)", color: "#9ca19d", fontWeight: 700 }}>الآن</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: isNext ? "rgba(214,169,62,0.25)" : "rgba(255,255,255,0.06)", margin: "10px 0" }} />

                  {/* Bottom: Times */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Adhan */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: "0.6rem", color: "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase", minWidth: 56 }}>أذان/ADHAN</span>
                      <span style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(1.8rem,3vw,3.8rem)", fontWeight: 900, color: isNext ? "#ffffff" : isPast ? "#9ca19d" : "rgba(255,255,255,0.85)", lineHeight: 1, letterSpacing: "0.04em" }}>
                        {p.time}
                      </span>
                    </div>
                    {/* Iqama */}
                    {p.iqama && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "0.6rem", color: isNext ? "rgba(214,169,62,0.6)" : "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase", minWidth: 56 }}>إقامة/IQAMA</span>
                        <span style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(1.2rem,2vw,2.5rem)", fontWeight: 700, color: isNext ? "#d6a93e" : isPast ? "#9ca19d" : "rgba(214,169,62,0.7)", lineHeight: 1, letterSpacing: "0.04em" }}>
                          {p.iqama}
                        </span>
                        <span style={{ fontSize: "0.55rem", color: "#9ca19d", opacity: 0.6 }}>+{p.offset}م</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── TICKERS ── */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 10 }}>
        {/* News */}
        <div style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap", alignItems: "center", background: "#d6a93e", padding: "10px 0" }}>
          <div style={{ fontWeight: 800, flexShrink: 0, padding: "0 24px", fontSize: "clamp(0.85rem,1.2vw,1.4rem)", color: "#1a2420", borderRight: "2px solid rgba(26,36,32,0.25)", marginRight: 16, lineHeight: 1.2 }}>
            <div>أخبار</div><div style={{ fontSize: "70%", opacity: 0.65, letterSpacing: "0.1em" }}>NEWS</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ display: "inline-block", animation: "marquee 40s linear infinite", fontSize: "clamp(0.85rem,1.15vw,1.3rem)", color: "#1a2420", fontWeight: 500 }}>
              {NEWS.join("  ✦  ")} &nbsp;&nbsp;&nbsp;&nbsp; {NEWS.join("  ✦  ")}
            </div>
          </div>
        </div>
        {/* Dhikr */}
        <div style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap", alignItems: "center", background: "rgba(0,0,0,0.5)", padding: "11px 0", backdropFilter: "blur(8px)" }}>
          <div style={{ fontWeight: 800, flexShrink: 0, padding: "0 24px", fontSize: "clamp(0.85rem,1.2vw,1.4rem)", color: "#d6a93e", borderRight: "1px solid rgba(214,169,62,0.25)", marginRight: 16, lineHeight: 1.2 }}>
            <div>أذكار</div><div style={{ fontSize: "70%", opacity: 0.55, letterSpacing: "0.1em" }}>DHIKR</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ display: "inline-block", animation: "marquee 50s linear infinite", fontSize: "clamp(0.85rem,1.15vw,1.3rem)", color: "rgba(255,255,255,0.8)" }}>
              {DHIKR.join("  ✦  ")} &nbsp;&nbsp;&nbsp;&nbsp; {DHIKR.join("  ✦  ")}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}
