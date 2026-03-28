import * as cheerio from 'cheerio';
import { ScrapedTournament, Scraper } from './types.js';
import {
  parseDate,
  ALL_SKILL_LEVELS,
  extractCityState,
  sanitizeString,
  createTournament,
  DEFAULT_USER_AGENT,
} from './utils.js';
import { launchBrowser, fetchHtmlWithRetry } from './puppeteer.js';

const SOURCE_NAME = 'pickleballtournaments.com';
const BASE_URL = 'https://pickleballtournaments.com';
const MAX_PAGES = 20;

export const SOURCE_NAME_PICKLEBALLTOURNAMENTS = SOURCE_NAME;
export const BASE_URL_PICKLEBALLTOURNAMENTS = BASE_URL;

// PBT site caps at 5.5 — exclude 6.0 from "And Above" expansions
const PBT_SKILL_LEVELS = ALL_SKILL_LEVELS.filter((level) => parseFloat(level) <= 5.5);

export function parsePBTListDate(text: string): { startDate: string | null; endDate: string | null } {
  const result = { startDate: null as string | null, endDate: null as string | null };

  const trimmed = text?.trim();
  if (!trimmed) return result;

  // Split on " - " or " – " (en-dash), with optional surrounding whitespace
  const parts = trimmed.split(/\s+[-–]\s+/);

  if (parts.length >= 2) {
    result.startDate = parseDate(parts[0].trim());
    result.endDate = parseDate(parts[parts.length - 1].trim());
  } else {
    // Single date (no range separator found)
    result.startDate = parseDate(trimmed);
    result.endDate = result.startDate;
  }

  return result;
}

/**
 * Extract skill levels from a single PBT event title.
 * e.g. "Mens Doubles Skill: (3.5) Age: (Any)" → ["3.5"]
 *      "Womens Doubles Skill: (4.5 And Above) Age: (Any)" → ["4.5", "5.0", "5.5"]
 *      "Mens Doubles OPEN Cash Prize: (Any) Age: (Any)" → all skill levels (2.5–5.5)
 */
export function extractPBTEventSkillLevel(titleText: string): string[] {
  // Extract only the Skill: (...) portion to avoid matching Age: (...)
  const skillMatch = titleText.match(/Skill:\s*\(([^)]+)\)/i);

  if (!skillMatch) {
    // No Skill: found — check if "OPEN" appears before any "Age:" text
    const beforeAge = titleText.split(/Age:/i)[0];
    if (/\bOPEN\b/i.test(beforeAge)) {
      return [...PBT_SKILL_LEVELS];
    }
    return [];
  }

  const skillValue = skillMatch[1].trim();

  if (skillValue.toLowerCase() === 'any') {
    return [...PBT_SKILL_LEVELS];
  }

  // "4.5 And Above" → expand to 4.5, 5.0, 5.5
  const andAboveMatch = skillValue.match(/([\d.]+)\s+And\s+Above/i);
  if (andAboveMatch) {
    const baseLevel = parseFloat(andAboveMatch[1]);
    return PBT_SKILL_LEVELS.filter((level) => parseFloat(level) >= baseLevel);
  }

  // Plain numeric value like "3.0"
  const numericMatch = skillValue.match(/^[\d.]+$/);
  if (numericMatch) {
    return [skillValue];
  }

  return [];
}

async function fetchPickleballTournamentsListPage(url: string): Promise<cheerio.Root> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setUserAgent(DEFAULT_USER_AGENT);
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });

      try {
        await page.waitForSelector('a.block[href*="/tournaments/"]', { timeout: 15000 });
      } catch {
        console.log('Tournament card links not found within timeout, continuing with current content');
      }

      try {
        await page.waitForFunction(
          'document.body.textContent && document.body.textContent.includes("results found")',
          { timeout: 10000 }
        );
      } catch {
        // Page may not show results count — continue anyway
      }

      const html = await page.content();
      return cheerio.load(html);
    } catch (error) {
      lastError = error as Error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
      }
    } finally {
      await browser.close();
    }
  }

  throw lastError || new Error('Failed to fetch page after retries');
}

export async function scrapePickleballTournamentPage(
  url: string
): Promise<ScrapedTournament | null> {
  try {
    const $ = await fetchHtmlWithRetry(url);

    // Name: first non-empty h1
    const name = sanitizeString(
      $('h1')
        .filter((_, el) => $(el).text().trim().length > 0)
        .first()
        .text()
    );

    if (!name) {
      return null;
    }

    // Description: find sections with h1.text-blue-600 headings
    const descriptionSections = [
      'Tournament Description',
      'Additional Information',
      'Refund Policy',
      'Prize Money',
    ];
    const sections: string[] = [];

    $('h1.text-blue-600').each((_, el) => {
      const sectionTitle = $(el).text().trim();
      if (!descriptionSections.includes(sectionTitle)) return;

      // Content is in sibling div#details-content or div with whitespace-pre-line class
      const contentDiv = $(el)
        .siblings('div#details-content, div.whitespace-pre-line')
        .first();

      const paragraphs: string[] = [];
      contentDiv.find('div.mb-4').each((_, p) => {
        const text = sanitizeString($(p).text());
        if (text) paragraphs.push(text);
      });

      const content = paragraphs.join('\n\n');
      if (content) {
        sections.push(`## ${sectionTitle}\n${content}`);
      }
    });

    const description = sections.length > 0 ? sections.join('\n\n') : undefined;

    // Location: extract from Google Maps link q= parameter
    let location = '';
    let city = '';
    let state = '';

    const mapsLink = $('a[href*="google.com/maps"]').first();
    if (mapsLink.length) {
      const href = mapsLink.attr('href') || '';
      try {
        const urlObj = new URL(href);
        const q = urlObj.searchParams.get('q');
        if (q) {
          location = q;
          const extracted = extractCityState(location);
          city = extracted.city;
          state = extracted.state;
        }
      } catch {
        // URL parse failed — location stays empty
      }
    }

    // Registration URL
    let registrationUrl: string | undefined;
    const registerLink = $('a[aria-label="Link to Register for the Tournament"]').first();
    if (registerLink.length) {
      registrationUrl = registerLink.attr('href') || undefined;
    }

    // Image: first img with object-contain class, preferring pickleballbrackets CDN
    let imageUrl: string | undefined =
      $('img[src*="pickleballbrackets.com"]').first().attr('src') ||
      $('img.object-contain').first().attr('src');

    // Dates: look for text matching a date range near a calendar icon, then fall back to page scan
    let startDate = '';
    let endDate = '';

    const fullDateRange =
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+[-–]\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/;
    const singleDate =
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/;

    // Try calendar icon parent first
    const calendarParent = $('[data-icon="calendar-days"]').closest('div').parent();
    if (calendarParent.length) {
      const calText = calendarParent.text().trim();
      const match = calText.match(fullDateRange);
      if (match) {
        const dates = parsePBTListDate(match[0]);
        if (dates.startDate) {
          startDate = dates.startDate;
          endDate = dates.endDate || dates.startDate;
        }
      }
    }

    // Fallback: scan divs/spans for date range text
    if (!startDate) {
      $('div, span, p').each((_, el) => {
        if (startDate) return;
        const ownText = $(el).clone().children().remove().end().text().trim();
        const match = ownText.match(fullDateRange);
        if (match) {
          const dates = parsePBTListDate(match[0]);
          if (dates.startDate) {
            startDate = dates.startDate;
            endDate = dates.endDate || dates.startDate;
          }
        }
      });
    }

    // Last resort: any single date
    if (!startDate) {
      $('div, span, p').each((_, el) => {
        if (startDate) return;
        const ownText = $(el).clone().children().remove().end().text().trim();
        const match = ownText.match(singleDate);
        if (match) {
          const dates = parsePBTListDate(match[0]);
          if (dates.startDate) {
            startDate = dates.startDate;
            endDate = dates.startDate;
          }
        }
      });
    }

    return createTournament(SOURCE_NAME, {
      name,
      sourceUrl: url,
      location,
      city,
      state,
      startDate,
      endDate,
      skillLevels: [],
      description,
      imageUrl,
      registrationUrl,
    });
  } catch (error) {
    console.error(`Error scraping tournament page ${url}:`, error);
    return null;
  }
}

export async function scrapePickleballTournamentEvents(tournamentUrl: string): Promise<string[]> {
  try {
    const base = tournamentUrl.replace(/\/$/, '');
    const eventsUrl = `${base}/events`;

    const $ = await fetchHtmlWithRetry(eventsUrl);

    const skillLevels = new Set<string>();

    $('div.text-base.font-bold.text-gray-900').each((_, el) => {
      const titleText = $(el).text().trim();
      const levels = extractPBTEventSkillLevel(titleText);
      levels.forEach((level) => skillLevels.add(level));
    });

    return [...skillLevels];
  } catch (error) {
    console.warn(`Warning: could not load events page for ${tournamentUrl}:`, error);
    return [];
  }
}

export async function scrapePickleballTournaments(): Promise<ScrapedTournament[]> {
  const tournaments: ScrapedTournament[] = [];
  const seenUrls = new Set<string>();
  const tournamentUrls: string[] = [];

  try {
    // Phase 1: collect tournament URLs from list pages
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${BASE_URL}/search?zoom_level=7&current_page=${page}&show_all=true&tournament_filter=local`;
      console.log(`Scraping page ${page}: ${url}`);

      const $ = await fetchPickleballTournamentsListPage(url);
      const cards = $('a.block[href*="/tournaments/"]');
      console.log(`Found ${cards.length} tournament cards on page ${page}`);

      if (cards.length === 0) {
        const bodyText = $('body').text();
        if (bodyText.includes('No Tournaments')) {
          console.log('No Tournaments text found — pagination exhausted');
        } else {
          console.log('No cards found and no "No Tournaments" text — stopping pagination');
        }
        break;
      }

      cards.each((_, el) => {
        const card = $(el);
        const href = card.attr('href');
        if (!href || !href.includes('/tournaments/')) return;

        const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (seenUrls.has(sourceUrl)) return;
        seenUrls.add(sourceUrl);
        tournamentUrls.push(sourceUrl);
      });

      console.log(`Page ${page}: ${tournamentUrls.length} tournament URLs accumulated`);
    }

    // Phase 2: scrape detail page + events page per tournament
    for (const url of tournamentUrls) {
      console.log(`Scraping detail page: ${url}`);
      const tournament = await scrapePickleballTournamentPage(url);
      if (!tournament) {
        console.warn(`Skipping ${url} — detail page returned null`);
        continue;
      }

      const eventSkillLevels = await scrapePickleballTournamentEvents(url);
      tournament.skillLevels = [...new Set([...tournament.skillLevels, ...eventSkillLevels])];

      tournaments.push(tournament);
    }
  } catch (error) {
    console.error('Error in pickleballtournaments scraper:', error);
  }

  return tournaments;
}

export const pickleballTournamentsScraper: Scraper = {
  sourceName: SOURCE_NAME,
  baseUrl: BASE_URL,
  scrape: scrapePickleballTournaments,
};

export default scrapePickleballTournaments;
