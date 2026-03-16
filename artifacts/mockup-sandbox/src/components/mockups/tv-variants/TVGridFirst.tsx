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
  "لا إله إلا الله  ·  La ilaha illa Allah",
];

const NEXT_IDX = 0;
const NOW_IDX  = 5;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

export function TVGridFirst() {
  const now = useClock();
  const hh = "06";
  const mm = String(now.getSeconds() % 60).padStart(2, "0"); // dynamic for demo

  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const gregAr = now.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const gregEn = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hijriAr = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);
  const hijriEn = new Intl.DateTimeFormat("en-US-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(now);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#2a322e",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'Outfit', sans-serif", position: "relative",
    }}>
      {/* Geometric overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23d6a93e' stroke-width='0.8'/%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} />

      {/* ── HEADER ── */}
      <header style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center", padding: "16px 40px",
        borderBottom: "1px solid rgba(214,169,62,0.2)",
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)", zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: "clamp(1.3rem,2vw,2.2rem)", fontWeight: 800, color: "#d6a93e", direction: "rtl", lineHeight: 1.2 }}>مسجد الفاروق</div>
          <div style={{ fontSize: "clamp(0.8rem,1vw,1.2rem)", color: "rgba(214,169,62,0.5)", fontWeight: 600 }}>Al Faruk Moschee · Potsdam</div>
        </div>
        <div style={{ textAlign: "center", padding: "0 28px" }}>
          <div style={{ fontFamily: "'Outfit', monospace", fontWeight: 900, fontSize: "clamp(3rem,5.5vw,6rem)", color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>{timeStr}</div>
          <div style={{ fontSize: "0.78rem", color: "#9ca19d", marginTop: 4, display: "flex", gap: 10, justifyContent: "center" }}>
            <span style={{ direction: "rtl" }}>{gregAr}</span><span style={{ color: "rgba(214,169,62,0.3)" }}>|</span><span>{gregEn}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "clamp(1rem,1.5vw,1.8rem)", fontWeight: 700, color: "#d6a93e", direction: "rtl" }}>{hijriAr}</div>
          <div style={{ fontSize: "0.8rem", color: "rgba(214,169,62,0.5)", marginTop: 2 }}>{hijriEn}</div>
          <button style={{ marginTop: 6, fontSize: "0.75rem", padding: "4px 12px", borderRadius: 99, background: "rgba(214,169,62,0.1)", color: "#d6a93e", border: "1px solid rgba(214,169,62,0.3)", cursor: "pointer" }}>
            EXIT TV / عادي
          </button>
        </div>
      </header>

      {/* ── COUNTDOWN STRIP ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px",
        background: "linear-gradient(90deg, rgba(214,169,62,0.12) 0%, rgba(214,169,62,0.06) 50%, rgba(214,169,62,0.12) 100%)",
        borderBottom: "1px solid rgba(214,169,62,0.2)",
        minHeight: 90, gap: 32, zIndex: 10,
      }}>
        {/* Current period */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 4, height: 44, background: "rgba(156,161,157,0.4)", borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: "0.6rem", color: "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase" }}>الوقت الحالي · Current Period</div>
            <div style={{ fontSize: "clamp(1.3rem,2.2vw,2.6rem)", color: "#9ca19d", fontWeight: 700 }}>
              العشاء <span style={{ fontSize: "55%", opacity: 0.6 }}>Ishaa</span>
            </div>
          </div>
        </div>

        {/* Countdown — center focal point */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "0.6rem", color: "#9ca19d", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>
            الوقت المتبقي لـ الفجر  ·  Time remaining until Fadjr
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(2.5rem,5vw,5.5rem)", fontWeight: 900, color: "#d6a93e", letterSpacing: "-0.02em", lineHeight: 1 }}>{hh}</span>
              <div style={{ fontSize: "0.6rem", color: "rgba(214,169,62,0.5)", letterSpacing: "0.15em" }}>ساعة · HRS</div>
            </div>
            <span style={{ fontSize: "clamp(2rem,4vw,4.5rem)", fontWeight: 900, color: "rgba(214,169,62,0.4)", lineHeight: 1, marginBottom: 16 }}>:</span>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(2.5rem,5vw,5.5rem)", fontWeight: 900, color: "#d6a93e", letterSpacing: "-0.02em", lineHeight: 1 }}>{mm}</span>
              <div style={{ fontSize: "0.6rem", color: "rgba(214,169,62,0.5)", letterSpacing: "0.15em" }}>دقيقة · MIN</div>
            </div>
          </div>
        </div>

        {/* Next prayer adhan time */}
        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase" }}>أذان الفجر · Fadjr Adhan</div>
            <div style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(1.5rem,2.5vw,3rem)", fontWeight: 900, color: "#d6a93e", lineHeight: 1, letterSpacing: "0.04em" }}>04:26</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(214,169,62,0.6)", letterSpacing: "0.15em" }}>إقامة · IQAMA: <strong>04:46</strong></div>
          </div>
          <div style={{ width: 4, height: 44, background: "rgba(214,169,62,0.4)", borderRadius: 2 }} />
        </div>
      </div>

      {/* ── PRAYER GRID — FULL WIDTH ── */}
      <main style={{ flex: 1, padding: "16px 24px", minHeight: 0, zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, height: "100%" }}>
          {PRAYERS.map((p, idx) => {
            const isNext = idx === NEXT_IDX;
            const isCurrent = idx === NOW_IDX;
            const isPast = idx > NOW_IDX && !isNext;

            return (
              <div key={p.name} style={{
                borderRadius: 16,
                padding: "16px 18px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                background: isNext
                  ? "linear-gradient(160deg, rgba(214,169,62,0.22) 0%, rgba(214,169,62,0.06) 100%)"
                  : isCurrent
                    ? "rgba(156,161,157,0.1)"
                    : "rgba(38,48,44,0.95)",
                border: isNext
                  ? "2px solid rgba(214,169,62,0.65)"
                  : isCurrent
                    ? "1px solid rgba(156,161,157,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isNext ? "0 0 40px rgba(214,169,62,0.18), 0 0 80px rgba(214,169,62,0.06)" : "none",
                opacity: isPast ? 0.38 : 1,
                backdropFilter: "blur(8px)",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Background glow for next */}
                {isNext && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top, rgba(214,169,62,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />}

                {/* Top */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "clamp(1.4rem,2vw,2.6rem)", fontWeight: 800, color: isNext ? "#d6a93e" : "#ffffff", direction: "rtl", lineHeight: 1.1 }}>
                      {p.nameAr}
                    </div>
                    {isNext && <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: 99, background: "#d6a93e", color: "#1a2420", fontWeight: 800 }}>NEXT</span>}
                    {isCurrent && !isNext && <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: 99, background: "rgba(156,161,157,0.2)", color: "#9ca19d", fontWeight: 800 }}>NOW</span>}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: isNext ? "rgba(214,169,62,0.6)" : "#9ca19d", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 }}>
                    {p.name}
                  </div>
                  {isNext && <span style={{ fontSize: "0.6rem", color: "#d6a93e", opacity: 0.8 }}>التالي</span>}
                  {isCurrent && !isNext && <span style={{ fontSize: "0.6rem", color: "#9ca19d", opacity: 0.6 }}>الآن</span>}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: isNext ? "rgba(214,169,62,0.2)" : "rgba(255,255,255,0.05)", margin: "8px 0" }} />

                {/* Bottom: Times */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", color: "#9ca19d", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      أذان / ADHAN
                    </div>
                    <div style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(1.7rem,2.8vw,3.5rem)", fontWeight: 900, color: isNext ? "#ffffff" : isPast ? "#9ca19d" : "rgba(255,255,255,0.85)", lineHeight: 1, letterSpacing: "0.04em" }}>
                      {p.time}
                    </div>
                  </div>
                  {p.iqama && (
                    <div>
                      <div style={{ fontSize: "0.55rem", color: isNext ? "rgba(214,169,62,0.65)" : "#9ca19d", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                        إقامة / IQAMA
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontFamily: "'Outfit', monospace", fontSize: "clamp(1.1rem,1.8vw,2.3rem)", fontWeight: 700, color: isNext ? "#d6a93e" : isPast ? "#9ca19d" : "rgba(214,169,62,0.65)", lineHeight: 1, letterSpacing: "0.04em" }}>
                          {p.iqama}
                        </span>
                        <span style={{ fontSize: "0.5rem", color: "#9ca19d", opacity: 0.55 }}>+{p.offset}م</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── TICKERS ── */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap", alignItems: "center", background: "#d6a93e", padding: "9px 0" }}>
          <div style={{ fontWeight: 800, flexShrink: 0, padding: "0 20px", fontSize: "1rem", color: "#1a2420", borderRight: "2px solid rgba(26,36,32,0.25)", marginRight: 14, lineHeight: 1.3 }}>
            <div>أخبار</div><div style={{ fontSize: "70%", opacity: 0.6, letterSpacing: "0.1em" }}>NEWS</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ display: "inline-block", animation: "marquee 40s linear infinite", fontSize: "1rem", color: "#1a2420", fontWeight: 500 }}>
              {NEWS.join("  ✦  ")} &nbsp;&nbsp; {NEWS.join("  ✦  ")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", overflow: "hidden", whiteSpace: "nowrap", alignItems: "center", background: "rgba(0,0,0,0.45)", padding: "10px 0", backdropFilter: "blur(8px)" }}>
          <div style={{ fontWeight: 800, flexShrink: 0, padding: "0 20px", fontSize: "1rem", color: "#d6a93e", borderRight: "1px solid rgba(214,169,62,0.25)", marginRight: 14, lineHeight: 1.3 }}>
            <div>أذكار</div><div style={{ fontSize: "70%", opacity: 0.55, letterSpacing: "0.1em" }}>DHIKR</div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ display: "inline-block", animation: "marquee 50s linear infinite", fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>
              {DHIKR.join("  ✦  ")} &nbsp;&nbsp; {DHIKR.join("  ✦  ")}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}
