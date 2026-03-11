# Write Tests for Scrapers

## Overview
Write comprehensive tests for the refactored functional scrapers. Tests will verify utility functions and scraper logic without requiring actual network requests or browser automation.

## Testing Strategy
- Use Vitest (or Jest if already configured)
- Mock Puppeteer/browser dependencies
- Test pure functions with known inputs/outputs
- Create test fixtures for HTML samples

---

## Phase 1: Setup Testing Framework

- [x] Check if Vitest or Jest is already configured (check package.json, server/package.json)
- [x] If not configured, add Vitest to server devDependencies
- [x] Configure test script in server/package.json (`"test": "vitest"`)
- [x] Create `server/vitest.config.ts` with appropriate settings (alias, environment)
- [x] Create `server/src/scraper/__tests__/` directory

---

## Phase 2: Test Utility Functions

- [x] Create `server/src/scraper/__tests__/utils.test.ts`
- [x] Test `parseDate()` - various date formats, invalid inputs, edge cases
- [x] Test `toPacificTime()` - timezone conversion
- [x] Test `parseSkillLevels()` - numeric levels (3.0, 4.5), text levels (Beginner, Open), mixed, duplicates
- [x] Test `extractCityState()` - "City, State", "City, State ZIP", empty, single part
- [x] Test `sanitizeString()` - whitespace, null/undefined, normal strings
- [x] Test `extractDomain()` - valid URLs, invalid URLs, with/without www

---

## Phase 3: Test Puppeteer Utilities

- [x] Create `server/src/scraper/__tests__/puppeteer.test.ts`
- [x] Mock puppeteer for all tests
- [x] Test `launchBrowser()` - verifies puppeteer.launch is called with correct args
- [x] Test `createPage()` - verifies browser.newPage and setUserAgent
- [x] Test `fetchHtml()` - verifies cheerio.load is returned

---

## Phase 4: Test Maincourt Scraper Functions

- [x] Create `server/src/scraper/__tests__/maincourt.test.ts`
- [x] Create test fixtures: sample HTML for list page, sample HTML for tournament page
- [x] Test `extractMaincourtDates()` - date range patterns, single dates, month formats
- [x] Test `extractMaincourtSkillLevel()` - various title formats
- [x] Test `extractMaincourtJsonData()` - mock cheerio with script content
- [x] Test `parseMaincourtJsonTournament()` - valid/invalid tournament objects

---

## Phase 5: Test PickleballTournaments Scraper Functions

- [x] Create `server/src/scraper/__tests__/pickleballtournaments.test.ts`
- [x] Create test fixtures: sample HTML for list page, sample HTML for tournament page
- [x] Test `extractPickleballTournamentsDates()` - same patterns as maincourt
- [x] Test `extractPickleballTournamentsJsonData()` - mock cheerio
- [x] Test `parsePickleballTournamentJson()` - valid/invalid tournament objects

---

## Phase 6: Integration Tests (Optional)

- [x] Create `server/src/scraper/__tests__/integration.test.ts`
- [x] Use MSW (Mock Service Worker) or nock to mock HTTP responses
- [x] Test full scrape flow for each source (mocked network responses)

---

## Phase 7: Verify

- [x] Run `npm run test` (or server test command)
- [x] Ensure all tests pass
- [x] Check test coverage (target: >80% for utility functions)
