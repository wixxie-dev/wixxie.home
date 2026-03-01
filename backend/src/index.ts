import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { authRouter } from "./routes/auth.js";
import { servicesRouter, refreshAllStats } from "./routes/services.js";
import { tagsRouter } from "./routes/tags.js";
import { settingsRouter } from "./routes/settings.js";
import { authMiddleware } from "./auth.js";
import { db, initDb } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 300000);

initDb();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

app.use("/api", authMiddleware);

app.get("/api/me", (req, res) => {
  const row = db
    .prepare(`SELECT id, username, display_name FROM users WHERE id = ?`)
    .get(req.auth!.userId) as { id: number; username: string; display_name: string } | undefined;

  if (!row) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ id: row.id, username: row.username, displayName: row.display_name });
});

app.use("/api/services", servicesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/settings", settingsRouter);

const frontendDist = path.resolve(process.cwd(), "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`wixxie-home backend listening on ${PORT}`);
});

setInterval(() => {
  refreshAllStats().catch((err) => {
    console.error("stats refresh failed", err);
  });
}, POLL_INTERVAL_MS);
