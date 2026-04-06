# Wixxie Home

A Bun-based homelab landing dashboard with:

- Multi-user dashboards (each user has isolated services, tags, and settings)
- Drag-and-drop card ordering + pinned section
- Predefined app templates: Immich, Portainer, Home Assistant, Sonarr, Radarr, Uptime Kuma, Jellyfin, SABnzbd
- Optional API-backed stats per predefined app
- Dark/light/system theme
- Settings page for default web search engine, site tab title, and custom favicon upload

## Local Development

Requirements:

- Bun 1.3+

Install dependencies:

```bash
bun install
```

Run backend and frontend in dev mode:

```bash
bun run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## Build

```bash
bun run build
```

Run production backend (serves frontend build from `frontend/dist`):

```bash
bun run start
```

## Docker

Build and run:

```bash
docker compose up -d --build
```

Dashboard will be available at:

- `http://localhost` (port `80`)
- `http://localhost:443` (port `443`, plain HTTP unless you add TLS termination)

Data is persisted to:

- SQLite DB: `backend/data/wixxie-home.db`
- Uploaded favicons/icons: `backend/data/uploads/`

## Environment Variables

- `PORT` (default `3000`)
- `POLL_INTERVAL_MS` (default `300000`)
- `JWT_SECRET` (set this in production)
- `DISABLE_REGISTRATION` (`true` or `false`)

## Notes

- Predefined app API endpoints can vary by version and deployment. If a stats call fails, the card still works as a launcher.
- Services can be pinned by toggling pin or dragging into the pinned list.
