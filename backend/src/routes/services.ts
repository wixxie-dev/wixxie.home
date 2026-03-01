import { Router } from "express";
import { db, type DbServiceRow } from "../db.js";
import { fetchIntegrationStats } from "../integrations/index.js";

type ServiceInput = {
  name: string;
  url: string;
  icon?: string | null;
  openInNewTab?: boolean;
  appType?: string | null;
  apiConfig?: Record<string, string> | null;
  tags?: string[];
  isPinned?: boolean;
};

function parseApiConfig(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function getServiceTags(serviceId: number): string[] {
  const rows = db
    .prepare(
      `
      SELECT t.name
      FROM tags t
      JOIN service_tags st ON st.tag_id = t.id
      WHERE st.service_id = ?
      ORDER BY t.name ASC
      `,
    )
    .all(serviceId) as { name: string }[];
  return rows.map((r) => r.name);
}

function getCachedStats(serviceId: number): Record<string, string | number> | null {
  const row = db
    .prepare(`SELECT stats_json FROM cached_stats WHERE service_id = ?`)
    .get(serviceId) as { stats_json: string } | undefined;
  if (!row) {
    return null;
  }
  try {
    return JSON.parse(row.stats_json);
  } catch {
    return null;
  }
}

function serviceToDto(service: DbServiceRow) {
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    icon: service.icon,
    openInNewTab: Boolean(service.open_in_new_tab),
    appType: service.app_type,
    apiConfig: parseApiConfig(service.api_config),
    isPinned: Boolean(service.is_pinned),
    sortOrder: service.sort_order,
    pinnedSortOrder: service.pinned_sort_order,
    tags: getServiceTags(service.id),
    stats: getCachedStats(service.id),
    createdAt: service.created_at,
    updatedAt: service.updated_at,
  };
}

function upsertTags(userId: number, serviceId: number, tags: string[]) {
  db.prepare(`DELETE FROM service_tags WHERE service_id = ?`).run(serviceId);

  for (const rawTag of tags) {
    const tag = rawTag.trim().toLowerCase();
    if (!tag) {
      continue;
    }

    db.prepare(`INSERT INTO tags (user_id, name) VALUES (?, ?) ON CONFLICT(user_id, name) DO NOTHING`).run(
      userId,
      tag,
    );

    const tagRow = db
      .prepare(`SELECT id FROM tags WHERE user_id = ? AND name = ?`)
      .get(userId, tag) as { id: number } | undefined;
    if (tagRow) {
      db.prepare(`INSERT OR IGNORE INTO service_tags (service_id, tag_id) VALUES (?, ?)`).run(
        serviceId,
        tagRow.id,
      );
    }
  }
}

async function refreshAndCacheStats(service: DbServiceRow) {
  const apiConfig = parseApiConfig(service.api_config);
  const stats = await fetchIntegrationStats(service.app_type, service.url, apiConfig);
  if (!stats) {
    return null;
  }

  db.prepare(
    `
    INSERT INTO cached_stats (service_id, stats_json, last_updated)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(service_id) DO UPDATE SET
      stats_json = excluded.stats_json,
      last_updated = excluded.last_updated
    `,
  ).run(service.id, JSON.stringify(stats));

  return stats;
}

export const servicesRouter = Router();

servicesRouter.post("/test-connection", async (req, res) => {
  try {
    const body = req.body as { appType?: string; baseUrl?: string; apiConfig?: Record<string, string> };
    if (!body.appType || !body.baseUrl) {
      return res.status(400).json({ error: "appType and baseUrl are required" });
    }
    const apiConfig = body.apiConfig ?? {};
    const stats = await fetchIntegrationStats(body.appType, body.baseUrl, apiConfig);
    if (!stats) {
      return res.status(400).json({ error: "Connection failed. Check the URL and API key." });
    }
    return res.json({ ok: true, stats });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Connection test failed unexpectedly.";
    return res.status(500).json({ error: message });
  }
});

servicesRouter.get("/", (req, res) => {
  const userId = req.auth!.userId;
  const rows = db
    .prepare(
      `
      SELECT *
      FROM services
      WHERE user_id = ?
      ORDER BY
        is_pinned DESC,
        CASE WHEN is_pinned = 1 THEN pinned_sort_order ELSE sort_order END ASC,
        id ASC
      `,
    )
    .all(userId) as DbServiceRow[];

  return res.json(rows.map(serviceToDto));
});

servicesRouter.post("/", (req, res) => {
  const userId = req.auth!.userId;
  const input = req.body as ServiceInput;

  if (!input.name || !input.url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  const isPinned = Boolean(input.isPinned);
  const maxOrderRow = db
    .prepare(
      `SELECT COALESCE(MAX(CASE WHEN is_pinned = ? THEN CASE WHEN ? = 1 THEN pinned_sort_order ELSE sort_order END END), -1) AS max_order FROM services WHERE user_id = ?`,
    )
    .get(Number(isPinned), Number(isPinned), userId) as { max_order: number };

  const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

  const insert = db
    .prepare(
      `
      INSERT INTO services
      (user_id, name, url, icon, open_in_new_tab, app_type, api_config, is_pinned, sort_order, pinned_sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `,
    )
    .run(
      userId,
      input.name.trim(),
      input.url.trim(),
      input.icon?.trim() || null,
      input.openInNewTab === false ? 0 : 1,
      input.appType ?? null,
      input.apiConfig ? JSON.stringify(input.apiConfig) : null,
      Number(isPinned),
      isPinned ? 0 : nextOrder,
      isPinned ? nextOrder : 0,
    );

  const serviceId = Number(insert.lastInsertRowid);
  upsertTags(userId, serviceId, input.tags ?? []);

  const row = db.prepare(`SELECT * FROM services WHERE id = ?`).get(serviceId) as DbServiceRow;
  return res.status(201).json(serviceToDto(row));
});

servicesRouter.put("/:id(\\d+)", (req, res) => {
  const userId = req.auth!.userId;
  const id = Number(req.params.id);
  const input = req.body as ServiceInput;
  const existing = db
    .prepare(`SELECT * FROM services WHERE id = ? AND user_id = ?`)
    .get(id, userId) as DbServiceRow | undefined;

  if (!existing) {
    return res.status(404).json({ error: "Service not found" });
  }

  const isPinned = input.isPinned === undefined ? Boolean(existing.is_pinned) : Boolean(input.isPinned);
  const nextIcon =
    input.icon === undefined
      ? existing.icon
      : (input.icon ?? "").trim() || null;
  const nextOpenInNewTab =
    input.openInNewTab === undefined ? existing.open_in_new_tab : input.openInNewTab ? 1 : 0;
  const nextAppType = input.appType === undefined ? existing.app_type : input.appType;
  const nextApiConfig =
    input.apiConfig === undefined
      ? existing.api_config
      : input.apiConfig
        ? JSON.stringify(input.apiConfig)
        : null;

  db.prepare(
    `
    UPDATE services
    SET
      name = ?,
      url = ?,
      icon = ?,
      open_in_new_tab = ?,
      app_type = ?,
      api_config = ?,
      is_pinned = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    `,
  ).run(
    input.name?.trim() || existing.name,
    input.url?.trim() || existing.url,
    nextIcon,
    nextOpenInNewTab,
    nextAppType,
    nextApiConfig,
    Number(isPinned),
    id,
    userId,
  );

  if (input.tags) {
    upsertTags(userId, id, input.tags);
  }

  const row = db.prepare(`SELECT * FROM services WHERE id = ?`).get(id) as DbServiceRow;
  return res.json(serviceToDto(row));
});

servicesRouter.delete("/:id(\\d+)", (req, res) => {
  const userId = req.auth!.userId;
  const id = Number(req.params.id);
  db.prepare(`DELETE FROM services WHERE id = ? AND user_id = ?`).run(id, userId);
  return res.status(204).send();
});

servicesRouter.put("/reorder/all", (req, res) => {
  const userId = req.auth!.userId;
  const pinned = Array.isArray(req.body?.pinned) ? (req.body.pinned as number[]) : [];
  const regular = Array.isArray(req.body?.regular) ? (req.body.regular as number[]) : [];

  const tx = db.transaction(() => {
    pinned.forEach((id, idx) => {
      db.prepare(
        `UPDATE services SET is_pinned = 1, pinned_sort_order = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      ).run(idx, id, userId);
    });
    regular.forEach((id, idx) => {
      db.prepare(
        `UPDATE services SET is_pinned = 0, sort_order = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      ).run(idx, id, userId);
    });
  });
  tx();

  return res.json({ ok: true });
});

servicesRouter.post("/:id(\\d+)/refresh", async (req, res) => {
  const userId = req.auth!.userId;
  const id = Number(req.params.id);
  const row = db
    .prepare(`SELECT * FROM services WHERE id = ? AND user_id = ?`)
    .get(id, userId) as DbServiceRow | undefined;
  if (!row) {
    return res.status(404).json({ error: "Service not found" });
  }
  const stats = await refreshAndCacheStats(row);
  return res.json({ stats });
});

export async function refreshAllStats() {
  const rows = db
    .prepare(`SELECT * FROM services WHERE app_type IS NOT NULL`)
    .all() as DbServiceRow[];
  for (const row of rows) {
    await refreshAndCacheStats(row);
  }
}
