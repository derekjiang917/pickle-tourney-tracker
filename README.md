# pickle-tourney-tracker

Aggregates pickleball tournaments from various sources.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Set up the database**

```bash
cd server
npx prisma generate
npx prisma db push
```

This creates the SQLite database at `server/prisma/dev.db`.

3. **(Optional) Copy environment variables**

```bash
cp server/.env.example server/.env
```

The default configuration uses SQLite at `server/prisma/dev.db`.

## Development

### Start both client and server

```bash
npm run dev
```

- Client runs at http://localhost:5173
- Server runs at http://localhost:3001

### Start server only

```bash
npm run dev:server
```

### Start client only

```bash
npm run dev:client
```

## Running the Scraper (Cron Job)

### Trigger a scrape for all sources

```bash
npm run scrape
```

### Trigger a scrape for a specific source

```bash
# Scrape maincourt.com only
npm run scrape:maincourt

# Scrape pickleballtournaments.com only
npm run scrape:pickleballtournaments
```

You can also use curl directly:

```bash
curl -X POST http://localhost:3001/api/scrape/trigger -H "Content-Type: application/json" -d '{"source": "maincourt.com"}'
```

### Start the scheduled cron (runs daily at 6 AM UTC)

```bash
npm run scrape:start
# or
curl -X POST http://localhost:3001/api/scrape/scheduler/start
```

### Stop the scheduled cron

```bash
npm run scrape:stop
# or
curl -X POST http://localhost:3001/api/scrape/scheduler/stop
```

### Check scrape status

```bash
npm run scrape:status
# or
curl http://localhost:3001/api/scrape/status
```

### View scrape history

```bash
npm run scrape:history
# or
curl http://localhost:3001/api/scrape/history
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tournaments` | List tournaments |
| GET | `/api/tournaments/:id` | Get tournament by ID |
| POST | `/api/scrape/trigger` | Run scrape job manually |
| GET | `/api/scrape/status` | Get scrape status |
| GET | `/api/scrape/history` | Get scrape history |
| POST | `/api/scrape/scheduler/start` | Start daily cron |
| POST | `/api/scrape/scheduler/stop` | Stop daily cron |
| GET | `/health` | Health check |

## Building

```bash
npm run build
```

## Type Checking

```bash
npm run typecheck
```

## Linting

```bash
npm run lint
```
