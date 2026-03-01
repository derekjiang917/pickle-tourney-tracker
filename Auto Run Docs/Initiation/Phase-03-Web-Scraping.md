# Phase 03: Web Scraping Infrastructure

This phase implements the scraping system to collect tournament data from pickleballtournaments.com and maincourt.com. It sets up the scraping framework, implements site-specific scrapers, and configures the daily cron job.

## Tasks

- [ ] Install scraping dependencies in server: puppeteer, cheerio, node-cron, and types, set up `server/src/scraper/index.ts` as main orchestrator

- [ ] Create base Scraper interface/abstract class in `server/src/scraper/base.ts` defining scrape() method and common parsing utilities

- [ ] Implement pickleballtournaments.com scraper in `server/src/scraper/pickleballtournaments.ts`: analyze site structure, extract tournament name, location, dates, skill levels, and registration URL, handle pagination

- [ ] Implement maincourt.com scraper in `server/src/scraper/maincourt.ts`: analyze site structure, extract same fields as above, handle different HTML structure

- [ ] Create scraper registry in `server/src/scraper/registry.ts` mapping source names to scraper instances for easy expansion

- [ ] Implement tournament upsert logic in scrap checker: if tournament exists by sourceUrl, update existing or create new, use Prisma transaction for data integrity

- [ ] Set up node-cron scheduler in `server/src/jobs/scheduler.ts` to run scrape job daily at 6 AM UTC, add manual trigger endpoint for testing

- [ ] Add scraping status tracking: create ScrapeLog model to record start time, end time, tournaments found, errors, store in database

- [ ] Create POST /api/scrape/trigger endpoint to manually run scraper, GET /api/scrape/status to check last run results

- [ ] Test scrapers with live data, handle rate limiting and errors gracefully, verify data saves correctly to database
