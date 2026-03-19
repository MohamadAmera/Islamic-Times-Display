import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";
import fs from "fs";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built frontend static files
if (process.env.NODE_ENV === "production") {
  // In Docker/production: /app/public is copied to /app/public
  const frontendDist = path.resolve("/app/public");
  
  // Serve static files if the directory exists
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback — all non-API routes return index.html
    app.get("*", (_req, res) => {
      const indexPath = path.join(frontendDist, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: "Frontend not found" });
      }
    });
  } else {
    console.warn(`Frontend directory not found at ${frontendDist}`);
    // Fallback: API only mode
    app.get("*", (_req, res) => {
      res.status(404).json({ error: "Not Found. API endpoints available at /api/*" });
    });
  }
} else {
  // Development mode
  app.get("*", (_req, res) => {
    res.status(404).json({ error: "Not Found. API endpoints available at /api/*" });
  });
}

export default app;
