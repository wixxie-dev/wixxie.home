import { Router } from "express";
import { db, ensureUserSettings } from "../db.js";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

export const settingsRouter = Router();

const uploadsDir = path.resolve(process.cwd(), "backend", "data", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const userId = req.auth!.userId;
      const ext = path.extname(file.originalname || ".ico");
      cb(null, `favicon-${userId}${ext}`);
    },
  }),
});

settingsRouter.get("/", (req, res) => {
  const userId = req.auth!.userId;
  ensureUserSettings(userId);
  const row = db
    .prepare(
      `SELECT theme, search_engine, site_title, favicon_path FROM user_settings WHERE user_id = ?`,
    )
    .get(userId) as
    | {
        theme: string;
        search_engine: string;
        site_title: string;
        favicon_path: string | null;
      }
    | undefined;

  return res.json({
    theme: row?.theme ?? "system",
    searchEngine: row?.search_engine ?? "duckduckgo",
    siteTitle: row?.site_title ?? "Wixxie Home",
    faviconPath: row?.favicon_path ?? null,
  });
});

settingsRouter.put("/", (req, res) => {
  const userId = req.auth!.userId;
  ensureUserSettings(userId);

  const row = db
    .prepare(
      `SELECT theme, search_engine, site_title FROM user_settings WHERE user_id = ?`,
    )
    .get(userId) as
    | { theme: string; search_engine: string; site_title: string }
    | undefined;

  const current = {
    theme: row?.theme ?? "system",
    search_engine: row?.search_engine ?? "duckduckgo",
    site_title: row?.site_title ?? "Wixxie Home",
  };

  const theme =
    req.body?.theme !== undefined
      ? String(req.body.theme)
      : current.theme;
  const searchEngine =
    req.body?.searchEngine !== undefined
      ? String(req.body.searchEngine)
      : current.search_engine;
  const siteTitle = (
    req.body?.siteTitle !== undefined
      ? String(req.body.siteTitle)
      : current.site_title
  ).slice(0, 80);

  db.prepare(
    `
    UPDATE user_settings
    SET theme = ?, search_engine = ?, site_title = ?
    WHERE user_id = ?
    `,
  ).run(theme, searchEngine, siteTitle, userId);

  return res.json({ ok: true });
});

settingsRouter.post("/favicon", upload.single("favicon"), (req, res) => {
  const userId = req.auth!.userId;
  ensureUserSettings(userId);
  if (!req.file) {
    return res.status(400).json({ error: "No favicon file uploaded" });
  }
  const faviconPath = `/api/settings/favicon/${req.file.filename}`;
  db.prepare(`UPDATE user_settings SET favicon_path = ? WHERE user_id = ?`).run(faviconPath, userId);
  return res.json({ faviconPath });
});

settingsRouter.get("/favicon/:filename", (req, res) => {
  const filePath = path.join(uploadsDir, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }
  return res.sendFile(filePath);
});
