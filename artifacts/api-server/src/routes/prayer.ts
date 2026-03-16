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

// POST /api/admin/hadith-upload — replace the azkar array with uploaded hadiths
router.post("/admin/hadith-upload", (req, res) => {
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
