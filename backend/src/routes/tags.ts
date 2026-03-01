import { Router } from "express";
import { db } from "../db.js";

export const tagsRouter = Router();

tagsRouter.get("/", (req, res) => {
  const userId = req.auth!.userId;
  const rows = db
    .prepare(`SELECT id, name FROM tags WHERE user_id = ? ORDER BY name ASC`)
    .all(userId) as { id: number; name: string }[];

  return res.json(rows);
});
