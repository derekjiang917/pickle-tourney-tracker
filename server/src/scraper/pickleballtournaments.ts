import * as cheerio from 'cheerio';
import { ScrapedTournament, Scraper } from './types.js';
import {
  parseDate,
  parseSkillLevels,
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

export async function scrapePickleballTournaments(): Promise<ScrapedTournament[]> {
  const tournaments: ScrapedTournament[] = [];
  const seenUrls = new Set<string>();

  try {
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

        // Name: title attr on the name div, or its text content
        const nameEl = card.find('div[class*="line-clamp-2"][class*="font-medium"]');
        const name = sanitizeString(nameEl.attr('title') || nameEl.text());

        if (!name) {
          console.log(`Skipping card with no name at: ${sourceUrl}`);
          return;
        }

        // Location
        const locationEl = card.find('div.line-clamp-1.text-sm.text-gray-600');
        const locationText = sanitizeString(locationEl.text());
        const { city, state } = extractCityState(locationText);

        // Dates
        const dateEl = card.find('div.text-sm.line-clamp-1.text-gray-700');
        const dateText = sanitizeString(dateEl.text());
        const { startDate, endDate } = parsePBTListDate(dateText);

        // Image
        const imageUrl = card.find('img').first().attr('src');

        tournaments.push(
          createTournament(SOURCE_NAME, {
            name,
            sourceUrl,
            location: locationText,
            city,
            state,
            startDate: startDate || '',
            endDate: endDate || startDate || '',
            skillLevels: [],
            imageUrl,
          })
        );
      });

      console.log(`Page ${page}: ${tournaments.length} tournaments accumulated`);
    }
  } catch (error) {
    console.error('Error in pickleballtournaments scraper:', error);
  }

  return tournaments;
}

export async function scrapePickleballTournamentPage(
  url: string
): Promise<ScrapedTournament | null> {
  try {
    const $ = await fetchHtmlWithRetry(url);

    const name =
      sanitizeString($('h1').first().text()) ||
      sanitizeString($('[class*="text-3xl"]').text()) ||
      sanitizeString($('title').text().split('|')[0]);

    if (!name) {
      return null;
    }

    let location = '';
    let city = '';
    let state = '';

    const locationSelectors = [
      '[class*="venue"] a',
      '[class*="location"]',
      '[class*="Where"]',
      'span:contains("Where")',
    ];

    for (const selector of locationSelectors) {
      const locationText = $(selector).first().text().trim();
      if (locationText && locationText.length > 2) {
        location = locationText;
        const { city: c, state: s } = extractCityState(location);
        city = c;
        state = s;
        break;
      }
    }

    let startDate = '';
    let endDate = '';

    const dateSelectors = ['[class*="date"]', 'span:contains("202")', '[class*="When"]'];

    for (const selector of dateSelectors) {
      const dateText = $(selector).first().text().trim();
      const dates = parsePBTListDate(dateText);
      if (dates.startDate) {
        startDate = dates.startDate;
        endDate = dates.endDate || dates.startDate;
        break;
      }
    }

    let registrationUrl: string | undefined;
    const registerBtn = $(
      'a:contains("Register"), [class*="Register"] a, button:contains("Register")'
    );
    if (registerBtn.length > 0) {
      const href = registerBtn.attr('href');
      if (href) {
        registrationUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      }
    }

    const skillLevels: string[] = [];
    const pageText = $('body').text();
    const extractedSkills = parseSkillLevels(pageText);
    skillLevels.push(...extractedSkills);

    const description =
      sanitizeString($('[class*="description"], [class*="About"]').first().text()) ||
      sanitizeString($('meta[name="description"]').attr('content'));

    return createTournament(SOURCE_NAME, {
      name,
      sourceUrl: url,
      location,
      city,
      state,
      startDate,
      endDate,
      skillLevels: [...new Set(skillLevels)],
      description,
      registrationUrl,
    });
  } catch (error) {
    console.error(`Error scraping tournament page ${url}:`, error);
    return null;
  }
}

export const pickleballTournamentsScraper: Scraper = {
  sourceName: SOURCE_NAME,
  baseUrl: BASE_URL,
  scrape: scrapePickleballTournaments,
};

export default scrapePickleballTournaments;
