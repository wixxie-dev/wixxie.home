import https from "node:https";
import type { OutgoingHttpHeaders } from "node:http";

type StatsResult = Record<string, string | number>;
type ApiConfig = Record<string, string>;

type Fetcher = (baseUrl: string, apiConfig: ApiConfig) => Promise<StatsResult | null>;

/** HTTPS agent that accepts self-signed certs (for homelab services). */
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function fetchInsecure(
  url: string,
  headers: OutgoingHttpHeaders = {},
): Promise<{ ok: boolean; status: number; body: string }> {
  return new Promise((resolve) => {
    const u = new URL(url);
    const options: https.RequestOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: "GET",
      headers,
      agent: u.protocol === "https:" ? insecureAgent : undefined,
    };
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8"),
        }),
      );
    });
    req.on("error", () =>
      resolve({ ok: false, status: 0, body: "" }),
    );
    req.end();
  });
}

async function safeJson(url: string, init?: RequestInit): Promise<any | null> {
  const headers: OutgoingHttpHeaders = {};
  if (init?.headers && typeof init.headers === "object" && !(init.headers instanceof Headers)) {
    for (const [k, v] of Object.entries(init.headers)) {
      if (typeof v === "string") headers[k] = v;
    }
  }

  try {
    // Use insecure fetch for HTTPS so self-signed homelab certs work.
    if (url.startsWith("https://")) {
      const { ok, body } = await fetchInsecure(url, headers);
      if (!ok || !body) return null;
      return JSON.parse(body) as unknown;
    }
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch URL as text (for Prometheus /metrics etc). Supports HTTPS with optional headers. */
async function fetchText(
  url: string,
  headers: OutgoingHttpHeaders = {},
): Promise<{ ok: boolean; body: string }> {
  try {
    if (url.startsWith("https://")) {
      const result = await fetchInsecure(url, headers);
      return { ok: result.ok, body: result.body ?? "" };
    }
    const res = await fetch(url, { headers: headers as HeadersInit });
    const body = await res.text();
    return { ok: res.ok, body };
  } catch {
    return { ok: false, body: "" };
  }
}

const fetchers: Record<string, Fetcher> = {
  async immich(baseUrl, apiConfig) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
      return null;
    }
    const data = await safeJson(`${baseUrl.replace(/\/$/, "")}/api/server/statistics`, {
      headers: { "x-api-key": apiKey },
    });
    if (!data) {
      return null;
    }
    return {
      photos: data.photos ?? data.photosCount ?? 0,
      videos: data.videos ?? data.videosCount ?? 0,
      usageGB: data.usage ? Number(data.usage / 1024 / 1024 / 1024).toFixed(1) : "n/a",
    };
  },
  async portainer(baseUrl, apiConfig) {
    const token = apiConfig.token;
    if (!token) {
      return null;
    }
    const base = baseUrl.replace(/\/$/, "");

    type Headers = { Authorization?: string; "X-API-Key"?: string };
    const withBearer: Headers = { Authorization: `Bearer ${token}` };
    const withApiKey: Headers = { "X-API-Key": token };

    function getEndpoints(h: Headers): Promise<unknown> {
      return safeJson(`${base}/api/endpoints`, { headers: h });
    }
    function getContainers(endpointId: number, h: Headers): Promise<unknown> {
      return safeJson(
        `${base}/api/endpoints/${endpointId}/docker/containers/json?all=true`,
        { headers: h },
      );
    }

    function parseEndpointList(data: unknown): number[] {
      const toIds = (arr: unknown[]): number[] =>
        arr
          .map((e) => {
            if (e == null || typeof e !== "object") return undefined;
            const o = e as Record<string, unknown>;
            const id = o.Id ?? o.id;
            return typeof id === "number" ? id : undefined;
          })
          .filter((id): id is number => typeof id === "number");
      if (Array.isArray(data)) return toIds(data);
      if (data && typeof data === "object" && "endpoints" in data) {
        const list = (data as { endpoints: unknown[] }).endpoints;
        return Array.isArray(list) ? toIds(list) : [];
      }
      return [];
    }

    function parseContainerList(data: unknown): { running: number; stopped: number } {
      if (!Array.isArray(data)) return { running: 0, stopped: 0 };
      let running = 0;
      let stopped = 0;
      for (const c of data) {
        const state = (c?.State ?? c?.state ?? "").toString().toLowerCase();
        if (state === "running") running += 1;
        else stopped += 1;
      }
      return { running, stopped };
    }

    for (const headers of [withBearer, withApiKey]) {
      const endpointData = await getEndpoints(headers);
      const endpointIds = parseEndpointList(endpointData);
      const endpointId = endpointIds[0] ?? 1;

      const containerData = await getContainers(endpointId, headers);
      if (Array.isArray(containerData)) {
        const counts = parseContainerList(containerData);
        return { running: counts.running, stopped: counts.stopped };
      }
    }

    return null;
  },
  async home_assistant(baseUrl, apiConfig) {
    const token = apiConfig.token;
    if (!token) {
      return null;
    }
    const states = await safeJson(`${baseUrl.replace(/\/$/, "")}/api/states`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!Array.isArray(states)) {
      return null;
    }
    return { entities: states.length };
  },
  async sonarr(baseUrl, apiConfig) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
      return null;
    }
    const series = await safeJson(`${baseUrl.replace(/\/$/, "")}/api/v3/series`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!Array.isArray(series)) {
      return null;
    }
    return { series: series.length };
  },
  async radarr(baseUrl, apiConfig) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
      return null;
    }
    const movies = await safeJson(`${baseUrl.replace(/\/$/, "")}/api/v3/movie`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!Array.isArray(movies)) {
      return null;
    }
    return { movies: movies.length };
  },
  async uptime_kuma(baseUrl, apiConfig) {
    const base = baseUrl.replace(/\/$/, "");
    // Prefer /metrics (all monitors).
    const metricsUrl = `${base}/metrics`;
    const auth = apiConfig?.apiKey?.trim() ?? "";
    const authHeadersToTry: OutgoingHttpHeaders[] = [{}];

    if (auth) {
      const basicCreds = auth.includes(":") ? auth : `:${auth}`;
      authHeadersToTry.push({
        Authorization: `Basic ${Buffer.from(basicCreds, "utf8").toString("base64")}`,
      });
      authHeadersToTry.push({ Authorization: `Bearer ${auth}` });
      authHeadersToTry.push({ "X-API-Key": auth });
    }

    for (const headers of authHeadersToTry) {
      const { ok, body } = await fetchText(metricsUrl, headers);
      if (!ok || !body) continue;

      let up = 0;
      let down = 0;
      let sawMonitorStatus = false;

      // Prometheus format:
      // monitor_status{...} 1
      // monitor_status{...} 1 1234567890
      // monitor_status 1
      const valueRegex = /^monitor_status(?:\{[^}]*\})?\s+([0-9.]+)/;
      for (const line of body.split("\n")) {
        const trimmed = line.trim();
        const match = trimmed.match(valueRegex);
        if (!match) continue;
        sawMonitorStatus = true;
        const value = Number(match[1]);
        if (value === 1) up += 1;
        else if (value === 0) down += 1;
      }

      // Only trust /metrics if the expected metric is present.
      if (sawMonitorStatus) {
        return { up, down };
      }
    }

    // Fallback: public status-page heartbeat (no auth; only monitors in a public group on default status page)
    const data = await safeJson(`${base}/api/status-page/heartbeat/default`);
    if (!data || typeof data !== "object") return null;
    const heartbeatList = data.heartbeatList;
    if (!heartbeatList || typeof heartbeatList !== "object") return null;
    let up = 0;
    let down = 0;
    for (const monitorId of Object.keys(heartbeatList)) {
      const beats = heartbeatList[monitorId];
      if (!Array.isArray(beats) || beats.length === 0) continue;
      const latest = beats[beats.length - 1];
      const status = Number(latest?.status);
      if (status === 1) up += 1;
      else if (status === 0) down += 1;
    }
    return { up, down };
  },
  async jellyfin(baseUrl, apiConfig) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
      return null;
    }
    const data = await safeJson(`${baseUrl.replace(/\/$/, "")}/Items/Counts`, {
      headers: { "X-Emby-Token": apiKey },
    });
    if (!data || typeof data !== "object") {
      return null;
    }
    return {
      movies: data.MovieCount ?? data.movieCount ?? 0,
      series: data.SeriesCount ?? data.seriesCount ?? 0,
    };
  },
  async sabnzbd(baseUrl, apiConfig) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
      return null;
    }
    const queue = await safeJson(
      `${baseUrl.replace(/\/$/, "")}/api?mode=queue&output=json&apikey=${encodeURIComponent(apiKey)}`,
    );
    if (!queue?.queue) {
      return null;
    }
    return {
      queueItems: Number(queue.queue.noofslots ?? 0),
      speed: queue.queue.kbpersec ? `${queue.queue.kbpersec} KB/s` : "n/a",
    };
  },
};

export async function fetchIntegrationStats(
  appType: string | null,
  baseUrl: string,
  apiConfig: ApiConfig,
) {
  if (!appType || !fetchers[appType]) {
    return null;
  }
  return fetchers[appType](baseUrl, apiConfig);
}
