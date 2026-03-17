import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import {
  GetPrayerDataResponse,
  UpdatePrayerDataBody,
  UpdatePrayerDataResponse,
  VerifyAdminBody,
  VerifyAdminResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// __dirname is native in CJS (production build via esbuild)
// In ESM dev mode (tsx), derive it from import.meta
const _routeDir: string =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(new URL(import.meta.url).pathname);

const DATA_FILE = resolve(_routeDir, "../data/prayer_data.json");
const DIYANET_FILE = resolve(_routeDir, "../data/diyanet_data.json");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ── Diyanet helpers ───────────────────────────────────────────────────────────

interface DiyanetData {
  city?: string;
  city_full?: string;
  lat?: number;
  lon?: number;
  kibla?: number;
  year?: number;
  prayer_names?: {
    [key: string]: { EN: string; AR: string };
  };
  times?: {
    [month: string]: {
      [day: string]: {
        [prayer: string]: { t: string; idx: number };
        hijri_date?: string;
      };
    };
  };
}

function getTodayPrayersFromDiyanet(data: DiyanetData) {
  const now = new Date();
  const month = String(now.getMonth() + 1);
  const day = String(now.getDate());

  const dayData = data.times?.[month]?.[day];
  if (!dayData) return null;

  const names = data.prayer_names ?? {
    p1: { EN: "Fajr", AR: "الفجر" },
    p2: { EN: "Sunrise", AR: "الشروق" },
    p3: { EN: "Dhuhr", AR: "الظهر" },
    p4: { EN: "Asr", AR: "العصر" },
    p5: { EN: "Maghrib", AR: "المغرب" },
    p6: { EN: "Isha", AR: "العشاء" },
  };

  const prayers = [];
  for (const key of ["p1", "p2", "p3", "p4", "p5", "p6"]) {
    const entry = (dayData as any)[key];
    const name = names[key];
    if (entry && name) {
      prayers.push({
        name: name.EN,
        nameAr: name.AR,
        time: entry.t,
        enabled: true,
      });
    }
  }
  return prayers;
}

// ── Generic helpers ───────────────────────────────────────────────────────────

function readPrayerData() {
  if (!existsSync(DATA_FILE)) throw new Error("Prayer data file not found");
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function writePrayerData(data: unknown) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/prayer-data — serves today's times (from Diyanet if available)
router.get("/prayer-data", (_req, res) => {
  try {
    const data = readPrayerData();

    // If Diyanet data is stored, overlay today's prayer times
    if (existsSync(DIYANET_FILE)) {
      const diyanet: DiyanetData = JSON.parse(readFileSync(DIYANET_FILE, "utf-8"));
      const todayPrayers = getTodayPrayersFromDiyanet(diyanet);
      if (todayPrayers) {
        // Preserve iqamaOffset from stored prayer_data (set by admin)
        data.prayers = todayPrayers.map((p: any, i: number) => ({
          ...p,
          iqamaOffset: data.prayers?.[i]?.iqamaOffset ?? 0,
        }));
      }
      // Attach kibla angle if available
      if (diyanet.kibla !== undefined) {
        data.kibla = diyanet.kibla;
      }
    }

    const parsed = GetPrayerDataResponse.parse(data);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to read prayer data" });
  }
});

// PUT /api/admin/prayer-data — update mosque info / news / azkar (manual form)
router.put("/admin/prayer-data", (req, res) => {
  try {
    const body = UpdatePrayerDataBody.parse(req.body);

    if (body.adminPassword !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Invalid admin password" });
      return;
    }

    const currentData = readPrayerData();
    const updatedData = {
      ...currentData,
      mosque: body.mosque,
      prayers: body.prayers,
      news: body.news,
      azkar: body.azkar,
      lastUpdated: new Date().toISOString(),
    };

    writePrayerData(updatedData);
    res.json({ success: true, message: "Prayer data updated successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid request data" });
  }
});

// POST /api/admin/diyanet-upload — upload full Diyanet yearly JSON
router.post("/admin/diyanet-upload", (req, res) => {
  try {
    const { adminPassword, data } = req.body as { adminPassword: string; data: DiyanetData };

    if (adminPassword !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Invalid admin password" });
      return;
    }

    if (!data?.times || !data?.prayer_names) {
      res.status(400).json({ success: false, message: "Invalid Diyanet file format" });
      return;
    }

    // Save full Diyanet data
    writeFileSync(DIYANET_FILE, JSON.stringify(data, null, 2), "utf-8");

    // Update mosque city info if available
    if (data.city) {
      const prayerData = readPrayerData();
      if (!prayerData.mosque.name || prayerData.mosque.name === "Al-Noor Mosque") {
        prayerData.mosque.name = data.city_full || data.city;
        prayerData.mosque.nameAr = data.city_full || data.city;
        prayerData.mosque.address = `Lat: ${data.lat?.toFixed(5)}, Lon: ${data.lon?.toFixed(5)}`;
        writePrayerData(prayerData);
      }
    }

    // Count total days stored
    let dayCount = 0;
    for (const month of Object.values(data.times ?? {})) {
      dayCount += Object.keys(month).length;
    }

    res.json({ success: true, message: `Diyanet data saved — ${dayCount} days loaded for ${data.year ?? "year"}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save Diyanet data" });
  }
});

// POST /api/prayer/hadith — replace the azkar array with uploaded hadiths
router.post("/prayer/hadith", (req, res) => {
  try {
    const { adminPassword, hadiths } = req.body as {
      adminPassword: string;
      hadiths: Array<{ hadith_ar: string; hadith_de: string }>;
    };

    if (adminPassword !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Invalid admin password" });
      return;
    }

    if (!Array.isArray(hadiths) || hadiths.length === 0) {
      res.status(400).json({ success: false, message: "Invalid hadith data: expected non-empty array" });
      return;
    }

    for (const h of hadiths) {
      if (typeof h.hadith_ar !== "string" || typeof h.hadith_de !== "string") {
        res.status(400).json({ success: false, message: 'Each entry must have "hadith_ar" and "hadith_de" string fields' });
        return;
      }
    }

    const prayerData = readPrayerData();
    prayerData.azkar = hadiths;
    prayerData.lastUpdated = new Date().toISOString();
    writePrayerData(prayerData);

    res.json({ success: true, message: `${hadiths.length} Hadiths gespeichert / تم حفظ ${hadiths.length} حديثاً` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save hadith data" });
  }
});

// GET /api/monthly-prayer-times?month=M&year=Y — returns all days for the given month
router.get("/monthly-prayer-times", (req, res) => {
  try {
    if (!existsSync(DIYANET_FILE)) {
      res.status(404).json({ success: false, message: "No Diyanet data available. Please upload Diyanet data first." });
      return;
    }

    const diyanet: DiyanetData = JSON.parse(readFileSync(DIYANET_FILE, "utf-8"));
    const month = parseInt(req.query.month as string, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, message: "Invalid month parameter (1–12)" });
      return;
    }

    // Accept explicit year param for correct weekday calculation across year boundaries
    const queryYear = parseInt(req.query.year as string, 10);
    const year = (!isNaN(queryYear) && queryYear > 2000) ? queryYear : (diyanet.year || new Date().getFullYear());
    const monthData = diyanet.times?.[String(month)];

    if (!monthData) {
      res.status(404).json({ success: false, message: `No data found for month ${month}` });
      return;
    }

    const WEEKDAYS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

    const days = Object.keys(monthData)
      .map((d) => parseInt(d, 10))
      .sort((a, b) => a - b)
      .map((day) => {
        const dayData = (monthData as any)[String(day)];
        const date = new Date(year, month - 1, day);
        const weekdayDE = WEEKDAYS_DE[date.getDay()];
        const gregorianDate = `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.`;

        let hijriDate = "";
        const hijriRaw: string = dayData.hijri_date || "";
        if (hijriRaw) {
          const parts = hijriRaw.split("/");
          if (parts.length === 3) {
            hijriDate = `${parts[2].padStart(2, "0")}.${parts[1].padStart(2, "0")}.`;
          }
        }

        return {
          day,
          weekdayDE,
          gregorianDate,
          hijriDate,
          times: {
            p1: dayData.p1?.t ?? "",
            p2: dayData.p2?.t ?? "",
            p3: dayData.p3?.t ?? "",
            p4: dayData.p4?.t ?? "",
            p5: dayData.p5?.t ?? "",
            p6: dayData.p6?.t ?? "",
          },
        };
      });

    // Extract hijri year from the first day entry for the title
    const firstDayRaw = (monthData as any)[String(Object.keys(monthData).map(Number).sort((a,b)=>a-b)[0])]?.hijri_date || '';
    const hijriYear = firstDayRaw.split('/')[0] || '';

    res.json({ success: true, year, month, city: diyanet.city || "", hijriYear, days });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to read monthly prayer data" });
  }
});

// POST /api/admin/verify
router.post("/admin/verify", (req, res) => {
  try {
    const body = VerifyAdminBody.parse(req.body);

    if (body.password !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Invalid password" });
      return;
    }

    res.json({ success: true, message: "Authenticated" });
  } catch {
    res.status(400).json({ success: false, message: "Invalid request" });
  }
});

export default router;
