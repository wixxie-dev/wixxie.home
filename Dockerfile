FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN bun install

FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000
CMD ["bun", "run", "--filter", "backend", "start"]
