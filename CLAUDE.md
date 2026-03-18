# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

pickle-tourney-tracker - A web application that aggregates pickleball tournaments scraped from multiple sources.

## Architecture

- **Monorepo** with npm workspaces (`client/`, `server/`)
- **Client**: Vite + React + TypeScript (strict mode), port 5173
- **Server**: Express + TypeScript (strict mode), port 3001
- **Database**: SQLite via Prisma with `@prisma/adapter-better-sqlite3`
- **Scraping**: Puppeteer (JS-heavy pages) + Cheerio (HTML parsing) with a registry pattern

## Commands

```bash
# Development
npm run dev              # Start client + server concurrently
npm run dev:client       # Client only
npm run dev:server       # Server only

# Build & Check
npm run build            # Build both
npm run typecheck        # TypeScript check both workspaces
npm run lint             # ESLint both workspaces

# Testing (server only)
npm run test             # Run vitest once
npm run test:watch       # Run vitest in watch mode
# Run a single test file:
cd server && npx vitest run src/scraper/__tests__/someFile.test.ts

# Database (run from server/)
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Apply schema changes to SQLite
npx prisma studio        # Browse data in browser

# Scraping
npm run scrape                        # All sources
npm run scrape:maincourt              # maincourt.com only
npm run scrape:pickleballtournaments  # pickleballtournaments.com only
npm run scrape:status                 # Check current run status
npm run scrape:history                # View past scrape runs
npm run scrape:start                  # Enable daily cron (6 AM UTC)
npm run scrape:stop                   # Disable cron
```

## Server Architecture

### Data Flow
```
Cron / manual trigger
  → runScrapeJob() [jobs/scheduler.ts]
  → scraper.scrape() [scraper/registry.ts]
  → Puppeteer/Cheerio parse sites
  → upsertTournaments() [services/tournamentService.ts]
  → Prisma upsert by sourceUrl (SQLite)
  → ScrapeLog updated with results
```

### Key Layers
- **Routes** (`src/routes/`): `tournaments.ts` (GET list + single), `scrape.ts` (trigger, status, history, scheduler)
- **Services** (`src/services/`): `tournamentService.ts` — `getTournaments()`, `upsertTournaments()` (bulk upsert in transactions, deduplicates by `sourceUrl`)
- **Scraper** (`src/scraper/`): Registry pattern — `registry.ts` manages instances, `base.ts` provides abstract `BaseScraper` with Puppeteer/Cheerio helpers, `maincourt.ts` and `pickleballtournaments.ts` are concrete implementations
- **Middleware**: In-memory cache (`node-cache`, 5-min TTL, cleared on scrape completion), error handler, request logger
- **Scheduler** (`src/jobs/scheduler.ts`): `node-cron` daily job, tracks running state to prevent concurrent runs

### Database Schema (Prisma)
- `Tournament` — core fields: `name`, `sourceUrl` (unique), `source`, `city`, `state`, `startDate`, `endDate`
- `TournamentSkillLevel` — relation to Tournament (cascade delete), unique on `(tournamentId, skillLevel)`
- `ScrapeLog` — tracks each scrape run (status, errors, tournamentsFound)
- `User` — stub (auth not implemented)

### API Endpoints
| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | DB connection check |
| GET | `/api/tournaments` | Paginated; query params: `page`, `limit`, `location`, `date`, `skillLevels[]` |
| GET | `/api/tournaments/:id` | Single tournament with skill levels |
| POST | `/api/scrape/trigger` | Body: `{source?: string}`; blocks concurrent runs |
| GET | `/api/scrape/status` | Current run + last run |
| GET | `/api/scrape/history` | Past runs; query: `limit` |
| POST | `/api/scrape/scheduler/start` | Enable cron |
| POST | `/api/scrape/scheduler/stop` | Disable cron |

## Client Architecture

- **Filter state** (`hooks/useTournamentFilters.ts`): Synced to URL query params (`?location=&date=&skillLevels=&page=`) — filters are shareable/bookmarkable
- **API client** (`lib/api.ts`): Fetches `/api/tournaments` with retry logic (3 attempts, exponential backoff); base URL `http://localhost:3001` (proxied via Vite in dev)
- **Layout**: Responsive sidebar (desktop collapsible, mobile drawer) via `DashboardLayout.tsx`
- **UI components** (`components/ui/`): Radix UI primitives styled with Tailwind

### Filter Logic (server-side)
- `location`: Case-insensitive OR search across `city`, `state`, `location` fields
- `date`: Tournaments where `startDate <= filter AND endDate >= filter`
- `skillLevels`: `5.0+` expands to `[5.0, 5.5, 6.0]`; matches any skill level

## Environment

Server requires `/server/.env`:
```
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
PORT=3001
```

## Tech Stack

- React 18, Vite 5, TypeScript 5 (strict), Tailwind CSS 4, Radix UI
- Express 4, Prisma 7, better-sqlite3, Puppeteer 24, Cheerio, node-cron, node-cache
