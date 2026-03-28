# PBT Scraper Phase 1: Tournament List Page Extraction

Rewrite `server/src/scraper/pickleballtournaments.ts` to correctly extract tournament data from the pickleballtournaments.com list page using real HTML selectors derived from the actual site structure.

## Context

The current `pickleballtournaments.ts` scraper uses guessed CSS selectors that don't match the actual site HTML. This phase replaces the list-page scraping logic with correct selectors and pagination, extracting all available data from tournament cards without visiting individual tournament pages.

### Source files
- `server/src/scraper/pickleballtournaments.ts` — the scraper to rewrite
- `server/src/scraper/maincourt.ts` — reference implementation (working scraper)
- `server/src/scraper/utils.ts` — shared utilities (`parseDate`, `extractCityState`, `sanitizeString`, `createTournament`, `parseSkillLevels`)
- `server/src/scraper/puppeteer.ts` — shared Puppeteer helpers (`launchBrowser`, `fetchHtmlWithRetry`)
- `server/src/scraper/types.ts` — `ScrapedTournament`, `Scraper` interfaces

### List page URL pattern
```
https://pickleballtournaments.com/search?zoom_level=7&current_page={page}&show_all=true&tournament_filter=local
```

### Actual HTML structure of tournament cards on the list page

Each tournament card is an `<a class="block" href="https://pickleballtournaments.com/tournaments/{slug}">` containing:

```html
<a class="block" href="https://pickleballtournaments.com/tournaments/{slug}">
  <div class="group relative flex cursor-pointer ... flex-col rounded-xl border bg-white">
    <!-- Image -->
    <div class="relative flex items-center ...">
      <img alt="{Tournament Name}" src="{image_url}" />
    </div>
    <!-- Info -->
    <div class="flex flex-1 flex-col ...">
      <div class="!line-clamp-2 block text-sm font-medium text-gray-900"
           title="{Tournament Name}">
        {Tournament Name}
      </div>
      <div class="line-clamp-1 text-sm text-gray-600">{City, State, Country}</div>
      <div class="text-sm line-clamp-1 text-gray-700">{Mon DD, YYYY - Mon DD, YYYY}</div>
      <div class="mt-2 flex ...">
        <div class="... bg-success-700 ...">
          <p class="text-sm font-semibold">USD ${price}</p>
        </div>
        <div class="text-xs flex text-gray-600 ...">{N} players</div>
      </div>
    </div>
  </div>
</a>
```

### Pagination
- 25 tournaments per page
- Increment `current_page` query param until the page shows "No Tournaments found" or there are 0 tournament cards
- Results count text: "{N} results found" visible on the page

### Key data extractable from list cards
| Field | Selector / Method |
|-------|------------------|
| Name | `title` attribute on `div.\\!line-clamp-2` or its text content |
| URL | `href` on the `<a class="block">` |
| Location | Text of `div.line-clamp-1.text-sm.text-gray-600` (format: "City, ST, USA") |
| Dates | Text of `div.text-sm.line-clamp-1.text-gray-700` (format: "Mon DD, YYYY - Mon DD, YYYY") |
| Image | `src` attribute on `img` inside the card |
| Price | Text of `p.text-sm.font-semibold` inside `div.bg-success-700` |

### Date format from list page
Dates appear as: `Apr 10, 2026 - Apr 12, 2026`
The shared `parseDate()` handles this via its `new Date(cleaned)` fallback path.

### Location format
Locations appear as: `San Clemente, CA, USA`
The shared `extractCityState()` handles this — it skips "USA" and correctly finds "CA" as the state.

---

## Tasks

- [x] **Rewrite `fetchPickleballTournamentsListPage`** in `server/src/scraper/pickleballtournaments.ts`. Replace the current implementation with one that:
  1. Uses `launchBrowser()` from `server/src/scraper/puppeteer.ts` instead of inlining Puppeteer launch
  2. Sets user agent via the shared `DEFAULT_USER_AGENT` from utils
  3. Navigates with `waitUntil: 'load'` and 60s timeout
  4. Waits for tournament cards to appear using `page.waitForSelector('a.block[href*="/tournaments/"]', { timeout: 15000 })` — fall back gracefully if timeout
  5. Also try a secondary wait: check for the "results found" text to confirm the page loaded content (e.g., `page.waitForFunction(() => document.body.textContent?.includes('results found'), { timeout: 10000 })`) — catch and continue if this times out
  6. Keeps the existing retry logic (3 attempts with exponential backoff)
  7. Returns `cheerio.Root` as before

- [x] **Rewrite `scrapePickleballTournaments`** main function in `server/src/scraper/pickleballtournaments.ts`. Replace the current implementation:
  1. **Remove the JSON extraction path** — delete `extractPickleballTournamentsJsonData` and `parsePickleballTournamentJson` functions entirely. The site does NOT use Next.js `__NEXT_DATA__`; these were speculative and will never match.
  2. **List page URL**: Use `https://pickleballtournaments.com/search?zoom_level=7&current_page=${page}&show_all=true&tournament_filter=local` as the base URL pattern.
  3. **Pagination**: Loop starting at `current_page=1`. On each page:
     - Call `fetchPickleballTournamentsListPage(url)` to get the Cheerio root
     - Select all tournament card links: `$('a.block[href*="/tournaments/"]')` — these are the `<a>` tags wrapping each card
     - If no cards found, check for "No Tournaments" text in the page — if present, pagination is exhausted, break the loop
     - If no cards found and no "No Tournaments" text, also break (defensive)
     - Set a max page limit of 20 as a safety cap
  4. **Extract data from each card** using Cheerio on the list page HTML (do NOT visit individual tournament pages in this phase):
     - `sourceUrl`: The card's `href` attribute. Ensure it's a full URL (prepend `BASE_URL` if relative)
     - `name`: The `title` attribute on the `div` with classes containing `line-clamp-2` and `font-medium`, or fall back to its text content. Use `sanitizeString()`.
     - Location text: Find the `div` with classes `line-clamp-1 text-sm text-gray-600` inside the card. Use `extractCityState()` to parse city/state. Store the raw text as `location`.
     - Dates: Find the `div` with classes `text-sm line-clamp-1 text-gray-700`. Parse the text — it will be in format `"Mon DD, YYYY - Mon DD, YYYY"` or `"Mon DD, YYYY - Mon DD, YYYY"` (single day). Split on ` - ` and call `parseDate()` on each half.
     - `imageUrl`: The `src` attribute on the `img` inside the card
     - Skip duplicates by tracking seen URLs in a `Set<string>`
  5. **Build `ScrapedTournament`**: Use `createTournament(SOURCE_NAME, { ... })` with extracted fields. `skillLevels` will be an empty array for now (only available on detail pages). `description` and `registrationUrl` will be undefined (detail page data).
  6. Log progress: tournament count per page, total accumulated, when pagination ends

- [x] **Add a `parsePBTListDate` helper function** (exported, in `pickleballtournaments.ts`) that handles the specific date format from the list page. It should:
  1. Try to split on ` - ` (with spaces around the dash/en-dash — handle both `-` and `–`)
  2. Call `parseDate()` from utils on each part
  3. Return `{ startDate: string | null; endDate: string | null }`
  4. This replaces the overly generic `extractPickleballTournamentsDates` function — delete that function
  5. Handle edge case: single date (no dash) by returning same date for start and end

- [x] **Write unit tests** for the list page extraction logic. Create `server/src/scraper/__tests__/pickleballtournaments.test.ts` (or update it if it exists). Tests should:
  1. Test `parsePBTListDate` with:
     - Range: `"Apr 10, 2026 - Apr 12, 2026"` → `{ startDate: "2026-04-10", endDate: "2026-04-12" }`
     - Same day: `"Apr 10, 2026 - Apr 10, 2026"` → both dates equal
     - En-dash: `"Apr 10, 2026 – Apr 12, 2026"` → should still parse
     - Single date (no range): `"Apr 10, 2026"` → start and end both `"2026-04-10"`
     - Empty/garbage input → `{ startDate: null, endDate: null }`
  2. Test card extraction from a Cheerio-loaded HTML fixture. Use the real HTML from one tournament card (copy from the HTML provided above). Verify name, URL, location, city, state, dates, and imageUrl are correctly extracted.
  3. Run tests with `cd server && npx vitest run src/scraper/__tests__/pickleballtournaments.test.ts` and ensure they pass

- [x] **Clean up exports and verify typecheck**. After the rewrite:
  1. Ensure `pickleballTournamentsScraper` export and default export still work correctly
  2. Remove any dead imports (the old JSON parsing functions were only used internally, so removing them shouldn't break anything)
  3. Verify the scraper is still registered in `server/src/scraper/registry.ts`
  4. Run `npm run typecheck` from the project root and fix any type errors
  5. Run `npm run lint` from the project root and fix any lint errors

---

## Notes for Phase 2 (future)
- Individual tournament page scraping for: skill levels, description, registration URL
- The user will provide HTML from a tournament detail page
- The `scrapePickleballTournamentPage` function will be rewritten then
- Consider whether to scrape all detail pages or only enrich data that's missing from the list
