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

Run using Docker Compose:

```bash
docker compose pull
docker compose up -d
```

Dashboard will be available at:

- `http://localhost` (port `80`)

Data is persisted to:

- SQLite DB: `backend/data/wixxie-home.db`
- Uploaded favicons/icons: `backend/data/uploads/`

## Deploy with GHCR image

The compose file is set up to pull a published image from GitHub Container Registry:

- `ghcr.io/wixxie-dev/wixxie-home:latest`
- `ghcr.io/wixxie-dev/wixxie-home:vX.Y.Z`

Required environment variables:

```bash
export JWT_SECRET="replace-this-with-a-strong-secret"
```

Optional deployment image tag (defaults to `latest`):

```bash
export WIXXIE_TAG="v0.1.0"
```

Pull and run:

```bash
docker compose pull
docker compose up -d
```

### Copy/paste `docker-compose.yml` example

```yaml
services:
  wixxie-home:
    image: ghcr.io/wixxie-dev/wixxie-home:${WIXXIE_TAG:-latest}
    container_name: wixxie-home
    pull_policy: always
    ports:
      - "80:3000"
    environment:
      - PORT=3000
      - POLL_INTERVAL_MS=300000
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
      - DISABLE_REGISTRATION=false
    volumes:
      - ./backend/data:/app/backend/data
    restart: unless-stopped
```

If you need HTTPS, terminate TLS at a reverse proxy (for example Caddy, Traefik, or Nginx) and proxy to this container over HTTP on port `3000`. Mapping `443` directly to this container will trigger warnings because the app does not serve TLS by itself.

## CI and release automation

This repository includes three GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
  - Runs on pull requests and pushes to `main`
  - Installs dependencies and runs `bun run build`
- `Release` (`.github/workflows/release.yml`)
  - Runs on version tags like `v1.2.3`
  - Builds and pushes only the matching version tag to GHCR (immutable release tag pattern)
  - Creates a GitHub Release with generated notes
- `Publish Latest` (`.github/workflows/publish-latest.yml`)
  - Runs on pushes to `main`
  - Builds and pushes only `ghcr.io/wixxie-dev/wixxie-home:latest`

### Create a release

1. Merge your changes to `main`
2. Create and push a semantic version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. Wait for the `Release` workflow to finish
4. Pull the new tag in deployment environments by setting `WIXXIE_TAG`

### Tag immutability pattern

- `latest` is only published from `main`
- Version tags (`vX.Y.Z`) are only published from git tags
- This avoids accidental overwrite of release tags during normal branch pushes

### GHCR permissions notes

- Workflow uses `GITHUB_TOKEN` to push image and create release
- Repository workflow permissions must allow:
  - `contents: write`
  - `packages: write`

## Environment Variables

- `PORT` (default `3000`)
- `POLL_INTERVAL_MS` (default `300000`)
- `JWT_SECRET` (required in production)
- `DISABLE_REGISTRATION` (`true` or `false`)

## Notes

- Predefined app API endpoints can vary by version and deployment. If a stats call fails, the card still works as a launcher.
- Services can be pinned by toggling pin or dragging into the pinned list.
