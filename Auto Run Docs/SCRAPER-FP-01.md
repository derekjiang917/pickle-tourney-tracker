# Refactor Scrapers to Functional Programming

## Overview
Refactor the OOP-based scraper architecture (BaseScraper class with child classes) to a functional programming approach with reusable utilities and source-specific functions.

## Current State
- `base.ts` - Abstract `BaseScraper` class + utility functions
- `maincourt.ts` - `MaincourtScraper` extends `BaseScraper`
- `pickleballtournaments.ts` - `PickleballTournamentsScraper` extends `BaseScraper`
- Duplicated utilities in `index.ts`
- Registry instantiates scraper classes

## Target State
- `scraper/utils.ts` - All shared utility functions (parseDate, parseSkillLevels, extractCityState, sanitizeString, toPacificTime, etc.)
- `scraper/puppeteer.ts` - Browser/Page utilities (launchBrowser, createPage, fetchHtml, scrapeWithRetry)
- `scraper/maincourt.ts` - Functional scraper for maincourt.com (no class, exported functions)
- `scraper/pickleballtournaments.ts` - Functional scraper for pickleballtournaments.com (no class, exported functions)
- `scraper/registry.ts` - Updated to use functional scrapers
- `scraper/types.ts` - Shared interfaces (ScrapedTournament, Scraper, ScrapeResult)

---

## Phase 1: Create Utility Module

- [x] Create `server/src/scraper/types.ts` - Move `ScrapedTournament`, `Scraper` interface from base.ts and index.ts
- [x] Create `server/src/scraper/utils.ts` - Move all utility functions from base.ts (parseDate, toPacificTime, parseSkillLevels, extractCityState, sanitizeString, extractDomain)
- [x] Create `server/src/scraper/puppeteer.ts` - Move browser utilities (launchBrowser, createPage, fetchHtml) from base.ts

---

## Phase 2: Refactor maincourt.ts to Functional

- [x] Remove `MaincourtScraper` class, export functional `scrapeMaincourt()` instead
- [x] Export `fetchMaincourtListPage(url)` function for list page fetching
- [x] Export `scrapeMaincourtTournament(url)` function for individual tournament pages
- [x] Export `extractMaincourtDates(text)` function for date parsing
- [x] Export `extractMaincourtSkillLevel(title)` function for skill level extraction
- [x] Export `extractMaincourtJsonData($)` function for JSON extraction
- [x] Export `parseMaincourtJsonTournament(t, baseUrl)` function

---

## Phase 3: Refactor pickleballtournaments.ts to Functional

- [x] Remove `PickleballTournamentsScraper` class, export functional `scrapePickleballTournaments()` instead
- [x] Export `fetchPickleballTournamentsListPage(url)` function for list page fetching
- [x] Export `scrapePickleballTournamentPage(url)` function for individual tournament pages
- [x] Export `extractPickleballTournamentsDates(text)` function for date parsing
- [x] Export `extractPickleballTournamentsJsonData($)` function for JSON extraction
- [x] Export `parsePickleballTournamentJson(t, baseUrl)` function

---

## Phase 4: Update Registry and Exports

- [x] Update `server/src/scraper/registry.ts` to use functional scrapers (call functions instead of instantiate classes)
- [x] Update `server/src/scraper/index.ts` to export from new modules and remove duplicated code
- [x] Update `server/src/routes/scrape.ts` imports if needed
- [x] Run `npm run typecheck` to verify no type errors

---

## Phase 5: Cleanup

- [x] Keep `server/src/scraper/base.ts` for migration reference (deprecated)
- [x] Verify all functionality works end-to-end by running a test scrape (optional - requires network access)
