# Phase 01: Foundation & Working Prototype

This phase sets up the complete project structure for a Vite + Express monorepo, configures TypeScript, PostgreSQL with Prisma, and builds a working React frontend with shadcn/ui using the dark theme. By the end, you'll have a running app displaying tournament cards with mock data.

## Tasks

- [x] Initialize Vite + Express monorepo structure with package.json workspaces, creating `/client` folder for Vite React app and `/server` folder for Express API, and configure TypeScript in both with strict mode

- [x] Set up Prisma with PostgreSQL: create `server/prisma/schema.prisma` with Tournament model (id, name, sourceUrl, source, location, city, state, startDate, endDate, skillLevels, description, createdAt, updatedAt), generate client, and create `.env` template

- [x] Create Express server in `server/src/index.ts` with CORS, JSON parsing, health check endpoint at GET /health, and tournament routes stub

- [x] Install and configure shadcn/ui in client: run shadcn init with default dark theme, dark grey (#1a1a1a) background with dark blue (#3b82f6) accent, install Button, Card, Input, Select, Badge components

- [x] Build base layout and dark theme: configure Tailwind with custom dark theme colors, create AppLayout component with dark background, implement dark mode as default

- [x] Create TournamentCard component in `client/src/components/tournament/TournamentCard.tsx` displaying tournament name, location, dates, skill level badges, and "Sign Up" button linking to sourceUrl

- [x] Create TournamentList component with mock data displaying grid of TournamentCard items, add basic responsive layout with pagination UI stub

- [x] Add concurrently to root package.json scripts to run both client and server simultaneously, verify both start successfully and frontend displays tournament cards

- [x] Create Railway deployment configuration: Procfile for server, client build script, and environment variable documentation for DATABASE_URL
