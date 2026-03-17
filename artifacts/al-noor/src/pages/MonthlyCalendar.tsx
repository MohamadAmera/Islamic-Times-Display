import { useState, useEffect } from 'react';
import { usePrayerContext } from '@/context/PrayerContext';
import { ArrowLeft, FileDown, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Link, useSearch } from 'wouter';

const MONTHS_DE = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_AR = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const HIJRI_MONTHS_AR = ['', 'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];

const GOLD = '#C5A059';
const GOLD_LIGHT = '#fdfaf4';
const BORDER = `1px solid ${GOLD}`;

interface DayEntry {
  day: number;
  weekdayDE: string;
  gregorianDate: string;
  hijriDate: string;
  times: { p1: string; p2: string; p3: string; p4: string; p5: string; p6: string };
}

interface MonthlyResponse {
  success: boolean;
  year: number;
  month: number;
  city: string;
  hijriYear: string;
  days: DayEntry[];
  message?: string;
}


const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');

@media print {
  @page { size: A4 landscape; margin: 1cm; }
  body, html { background: white !important; margin: 0 !important; }
  .monthly-calendar-page { position: static !important; overflow: visible !important; height: auto !important; }
  .no-print { display: none !important; }
  .monthly-print-area { font-family: 'Cairo', sans-serif !important; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
}
@media screen {
  .monthly-print-area { font-family: 'Cairo', 'Segoe UI', sans-serif; }
}
`;

export default function MonthlyCalendar() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';

  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlMonth = parseInt(params.get('month') || '', 10);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  const nextYear = thisMonth === 12 ? thisYear + 1 : thisYear;

  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    !isNaN(urlMonth) && urlMonth >= 1 && urlMonth <= 12 ? urlMonth : null
  );
  const [selectedYear, setSelectedYear] = useState<number>(thisYear);
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMonth === null) return;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/monthly-prayer-times?month=${selectedMonth}`)
      .then((r) => r.json())
      .then((d: MonthlyResponse) => {
        if (!d.success) throw new Error(d.message || 'Fehler beim Laden');
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || 'Unbekannter Fehler');
        setLoading(false);
      });
  }, [selectedMonth, selectedYear]);

  const handleSelect = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setData(null);
  };

  if (selectedMonth === null) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1a211d 0%, #2a322e 100%)' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <style>{PRINT_CSS}</style>
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #d6a93e 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <div
            className="flex items-center gap-2 px-4 pt-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft size={18} style={isAr ? { transform: 'scaleX(-1)' } : undefined} />
              {isAr ? 'رجوع' : 'Zurück'}
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 pb-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Calendar size={36} style={{ color: GOLD }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {isAr ? 'مواقيت الشهر' : 'Monatszeiten'}
              </h1>
              <p className="text-sm" style={{ color: 'rgba(214,169,62,0.7)' }}>
                {isAr ? 'اختر الشهر لعرض الجدول وتصديره كـ PDF' : 'Monat auswählen — Tabelle anzeigen und als PDF exportieren'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <MonthCard
                label={isAr ? 'هذا الشهر' : 'Dieser Monat'}
                monthDE={MONTHS_DE[thisMonth]}
                monthAR={MONTHS_AR[thisMonth]}
                year={thisYear}
                gold={GOLD}
                onClick={() => handleSelect(thisMonth, thisYear)}
              />
              <MonthCard
                label={isAr ? 'الشهر القادم' : 'Nächster Monat'}
                monthDE={MONTHS_DE[nextMonth]}
                monthAR={MONTHS_AR[nextMonth]}
                year={nextYear}
                gold={GOLD}
                onClick={() => handleSelect(nextMonth, nextYear)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(160deg, #1a211d 0%, #2a322e 100%)' }}
      >
        <Loader2 size={48} style={{ color: GOLD }} className="animate-spin" />
        <p className="text-white font-semibold text-base">
          {isAr ? 'جاري التحميل...' : 'Wird geladen...'}
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: 'linear-gradient(160deg, #1a211d 0%, #2a322e 100%)' }}
      >
        <AlertCircle size={52} className="text-red-400" />
        <p className="text-white font-semibold text-base">{fetchError}</p>
        <button
          onClick={() => setSelectedMonth(null)}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: GOLD, color: '#1a211d' }}
        >
          {isAr ? 'رجوع' : 'Zurück'}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { year, month, days, hijriYear } = data;
  const hijriInfo = getHijriMonthsInfo(days, hijriYear);

  return (
    <div className="monthly-calendar-page fixed inset-0 z-50 overflow-y-auto bg-white">
      <style>{PRINT_CSS}</style>

      <div
        className="no-print flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10"
        style={{ borderColor: 'rgba(197,160,89,0.3)' }}
      >
        <button
          onClick={() => setSelectedMonth(null)}
          className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: '#555' }}
        >
          <ArrowLeft size={18} style={isAr ? { transform: 'scaleX(-1)' } : undefined} />
          {isAr ? 'رجوع' : 'Zurück'}
        </button>
        <span className="font-bold text-sm" style={{ color: GOLD }}>
          {MONTHS_DE[month]} {year}
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          style={{ background: GOLD, color: '#fff' }}
        >
          <FileDown size={16} />
          {isAr ? 'تصدير PDF' : 'PDF exportieren'}
        </button>
      </div>

      <div className="monthly-print-area p-4 md:p-8 max-w-5xl mx-auto">
        <CalendarHeader />

        <div className="titles text-center my-6">
          {hijriInfo.arabicTitle && (
            <h1
              className="font-bold mb-1"
              dir="rtl"
              style={{ color: GOLD, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontFamily: "'Cairo','Noto Naskh Arabic',serif" }}
            >
              {hijriInfo.arabicTitle}
            </h1>
          )}
          <h2
            className="font-bold"
            style={{ color: '#333', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}
          >
            {MONTHS_DE[month]} {year}
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr', fontSize: '13px' }}>
            <thead>
              <tr>
                {[
                  { ar: 'اليوم', de: 'Tag' },
                  { ar: 'هجري', de: 'Hijri' },
                  { ar: 'التاريخ', de: 'Datum' },
                  { ar: 'الفجر', de: 'Fadjr', highlight: true },
                  { ar: 'الشروق', de: 'Schuruk' },
                  { ar: 'الظهر', de: 'Duhr' },
                  { ar: 'العصر', de: 'Assr' },
                  { ar: 'المغرب', de: 'Maghrib', highlight: true },
                  { ar: 'العشاء', de: 'Ischaa' },
                ].map((col, i) => (
                  <th
                    key={i}
                    style={{
                      border: BORDER,
                      padding: '6px 4px',
                      textAlign: 'center',
                      background: col.highlight ? GOLD_LIGHT : GOLD_LIGHT,
                      color: GOLD,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '11px', color: '#333', fontFamily: "'Cairo','Noto Naskh Arabic',serif" }} dir="rtl">
                      {col.ar}
                    </span>
                    {col.de}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d.day} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.weekdayDE}.
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.hijriDate}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.gregorianDate}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333', background: GOLD_LIGHT }}>
                    {d.times.p1}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.times.p2}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.times.p3}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.times.p4}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333', background: GOLD_LIGHT }}>
                    {d.times.p5}
                  </td>
                  <td style={{ border: BORDER, padding: '6px 5px', textAlign: 'center', fontWeight: 700, color: '#333' }}>
                    {d.times.p6}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 text-center text-xs"
          style={{ color: '#888', fontStyle: 'italic' }}
        >
          Al Faruk Moschee — Muslime in Potsdam e.V. — Am Kanal 61, 14467 Potsdam — www.islam-potsdam.de
        </div>
      </div>
    </div>
  );
}

function MonthCard({ label, monthDE, monthAR, year, gold, onClick }: {
  label: string; monthDE: string; monthAR: string; year: number; gold: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `2px solid ${gold}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${gold}99` }}>{label}</span>
      <span className="text-xl font-bold text-white">{monthDE}</span>
      <span className="text-sm font-semibold" style={{ color: `${gold}cc`, fontFamily: "'Amiri','Noto Naskh Arabic',serif" }}>{monthAR}</span>
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{year}</span>
    </button>
  );
}

function CalendarHeader() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `2px solid ${GOLD}`,
        paddingBottom: '16px',
        marginBottom: '4px',
        direction: 'ltr',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: '12px', lineHeight: 1.9, fontWeight: 700, color: '#333', minWidth: '180px' }}>
        <div style={{ color: GOLD, fontWeight: 700 }}>📍 Am Kanal 61, 14467 Potsdam</div>
        <div><span style={{ color: GOLD }}>📞</span> 0179 729 71 79</div>
        <div><span style={{ color: GOLD }}>📧</span> Webmaster@islam-potsdam.de</div>
        <div><span style={{ color: GOLD }}>🌐</span> www.islam-potsdam.de</div>
      </div>

      <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
        <svg viewBox="0 0 48 48" width="64" height="64" style={{ fill: GOLD }}>
          <path d="M24 4C24 4 18 12 18 20C18 24 20.5 27 23 30C24.5 28.5 26 27 27 25.5C28.5 27 30 28.5 30 28.5C27.5 27 26 24 26 20C26 12 24 4 24 4Z" />
          <rect x="12" y="24" width="24" height="20" rx="1" />
          <rect x="6" y="30" width="4" height="14" />
          <rect x="38" y="30" width="4" height="14" />
          <rect x="21" y="32" width="6" height="12" rx="1" />
        </svg>
        <div style={{ fontSize: '13px', fontWeight: 800, color: GOLD, textTransform: 'uppercase', lineHeight: 1.3, marginTop: '4px' }}>
          Verein der Muslime<br />in Potsdam e.V.
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', fontFamily: "'Cairo','Noto Naskh Arabic',serif", marginTop: '2px' }} dir="rtl">
          الجمعية الإسلامية في بوتسدام
        </div>
      </div>

      <div style={{ fontSize: '12px', lineHeight: 1.9, fontWeight: 700, color: '#333', textAlign: 'right', minWidth: '200px' }}>
        <div><span style={{ color: GOLD }}>💳</span> Bankverbindung:</div>
        <div>Verein der Muslime in Potsdam e.V.</div>
        <div style={{ color: '#666', fontSize: '11px' }}>Mittelbrandenburgische Sparkasse</div>
        <div><span style={{ color: GOLD }}>IBAN:</span> DE62 1605 0000 3503 00 4865</div>
      </div>
    </div>
  );
}

function getHijriMonthsInfo(days: DayEntry[], hijriYear: string): { arabicTitle: string } {
  if (!days.length) return { arabicTitle: '' };

  const monthNums = new Set<number>();

  for (const d of days) {
    if (!d.hijriDate) continue;
    const parts = d.hijriDate.split('.');
    if (parts.length >= 2 && parts[1] !== '') {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m)) monthNums.add(m);
    }
  }

  const monthNames = Array.from(monthNums)
    .sort((a, b) => a - b)
    .map((n) => HIJRI_MONTHS_AR[n] ?? '')
    .filter(Boolean);

  if (!monthNames.length) return { arabicTitle: '' };

  const yearSuffix = hijriYear ? ` لِعَامِ ${toEasternArabicNumerals(hijriYear)} هـ` : '';
  const arabicTitle = `مَوَاقِيتُ صَلَوَاتِ شَهْرِ ${monthNames.join(' / ')}${yearSuffix}`;
  return { arabicTitle };
}

function toEasternArabicNumerals(str: string): string {
  return str.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
}
