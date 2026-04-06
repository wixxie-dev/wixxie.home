# Release, CI, and Tag Strategy

This document is for maintainers and contributors who publish images/releases.

## Workflows

This repository uses four GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
  - Runs on pull requests and pushes to `main`
  - Installs dependencies and runs `bun run build`
- `Release Please` (`.github/workflows/release-please.yml`)
  - Runs on pushes to `main`
  - Opens/updates a release PR with version and changelog changes
  - On merge, creates a Git tag and GitHub Release
- `Release` (`.github/workflows/release.yml`)
  - Runs on version tags like `v1.2.3`
  - Builds and pushes only the matching version tag to GHCR
  - Publishes multi-arch images (`linux/amd64`, `linux/arm64`)
  - Creates a GitHub Release with generated notes
- `Publish Latest` (`.github/workflows/publish-latest.yml`)
  - Runs on pushes to `main`
  - Builds and pushes only `ghcr.io/wixxie-dev/wixxie-home:latest`
  - Publishes multi-arch images (`linux/amd64`, `linux/arm64`)

## Release Process (Automated)

1. Create a feature branch and open a PR into `main`.
2. Wait for CI to pass and merge only reviewed changes.
3. `Publish Latest` runs automatically on `main` and refreshes the `latest` image.
4. Validate that `latest` works in staging or pre-prod.
5. `Release Please` opens (or updates) a release PR on `main`.
6. Review and merge that release PR when ready to publish a version.
7. Release Please creates the version tag (`vX.Y.Z`) and GitHub Release.
8. The `Release` workflow runs from that tag and publishes `ghcr.io/wixxie-dev/wixxie-home:vX.Y.Z`.
9. Deploy that exact version by setting `WIXXIE_TAG=vX.Y.Z` in your environment.

## Commit Format for Automatic Versioning

Release Please determines version bumps from commit messages on `main`. Conventional commits are recommended:

- `feat:` -> minor version bump
- `fix:` -> patch version bump
- `feat!:` or `BREAKING CHANGE:` -> major version bump

Example:

```bash
feat: add user avatar upload
fix: correct Docker healthcheck path
```

Commit format is enforced by:

- Local git hook (`.husky/commit-msg`) via `commitlint`
- CI job in `.github/workflows/ci.yml` on pull requests

## Manual Fallback

If needed, you can still create tags manually:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Recommended Environment Strategy

- Staging/edge tracks `latest` for fast feedback.
- Production uses pinned release tags (`vX.Y.Z`) for repeatable deployments.
- Roll back production by switching to the previous tag and redeploying.

## Tag Immutability Pattern

- `latest` is published only from `main`
- Version tags (`vX.Y.Z`) are published only from git tags
- Normal branch pushes do not overwrite release tags

## GHCR and GitHub Permissions

Repository settings should allow workflow tokens to write:

- `contents: write` (for creating GitHub Releases)
- `packages: write` (for pushing GHCR images)

If using a Personal Access Token to push workflow changes, include:

- `repo`
- `workflow`
