import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  GetPrayerDataResponse,
  UpdatePrayerDataBody,
  UpdatePrayerDataResponse,
  VerifyAdminBody,
  VerifyAdminResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "../data/prayer_data.json");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function readPrayerData() {
  if (!existsSync(DATA_FILE)) {
    throw new Error("Prayer data file not found");
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writePrayerData(data: unknown) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

router.get("/prayer-data", (_req, res) => {
  try {
    const data = readPrayerData();
    const parsed = GetPrayerDataResponse.parse(data);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to read prayer data" });
  }
});

router.put("/admin/prayer-data", (req, res) => {
  try {
    const body = UpdatePrayerDataBody.parse(req.body);

    if (body.adminPassword !== ADMIN_PASSWORD) {
      res.status(401).json(UpdatePrayerDataResponse.parse({ success: false, message: "Invalid admin password" }));
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

    res.json(UpdatePrayerDataResponse.parse({ success: true, message: "Prayer data updated successfully" }));
  } catch (err) {
    if (err instanceof Error && err.message.includes("password")) {
      res.status(401).json({ success: false, message: "Unauthorized" });
    } else {
      res.status(400).json({ success: false, message: "Invalid request data" });
    }
  }
});

router.post("/admin/verify", (req, res) => {
  try {
    const body = VerifyAdminBody.parse(req.body);

    if (body.password !== ADMIN_PASSWORD) {
      res.status(401).json(VerifyAdminResponse.parse({ success: false, message: "Invalid password" }));
      return;
    }

    res.json(VerifyAdminResponse.parse({ success: true, message: "Authenticated" }));
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid request" });
  }
});

export default router;
