import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";

// __dirname is native in CJS (production build); in ESM dev we derive it
const _dirname: string =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(new URL(import.meta.url).pathname);

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built frontend static files
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(_dirname, "../public");
  app.use(express.static(frontendDist));
  // SPA fallback — all non-API routes return index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
