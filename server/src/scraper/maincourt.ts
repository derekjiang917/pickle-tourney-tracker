import * as cheerio from 'cheerio';
import { ScrapedTournament, Scraper } from './types.js';
import {
  parseDate,
  parseSkillLevels,
  parseSkillInterval,
  extractCityState,
  sanitizeString,
  createTournament,
  ALL_SKILL_LEVELS,
} from './utils.js';
import { fetchHtmlWithRetry } from './puppeteer.js';

const SOURCE_NAME = 'maincourt.com';
const BASE_URL = 'https://maincourt.com';

export const SOURCE_NAME_MAINCOURT = SOURCE_NAME;
export const BASE_URL_MAINCOURT = BASE_URL;

export async function scrapeMaincourt(): Promise<ScrapedTournament[]> {
  const tournaments: ScrapedTournament[] = [];

  try {
    const $ = await fetchMaincourtListPage(`${BASE_URL}/events-list/tournaments/`);

    const tournamentCards = $('.tournamentslisting__card');
    console.log(`Found ${tournamentCards.length} tournament card elements`);

    if (tournamentCards.length > 0) {
      const seenUrls = new Set<string>();

      tournamentCards.each((_, element) => {
        const card = $(element);
        const link = card
          .find('.tournamentslisting__card__top__link, .tournamentslisting__card__content__link')
          .first();
        const href = link.attr('href');
        if (href && href.includes('/events-list/')) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl);
          }
        }
      });

      console.log(`Found ${seenUrls.size} unique tournament URLs`);

      for (const url of Array.from(seenUrls)) {
        try {
          const tournament = await scrapeMaincourtTournament(url);
          if (tournament) {
            tournaments.push(tournament);
          }
        } catch (error) {
          console.error(`Error scraping tournament ${url}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in maincourt scraper:', error);
  }

  return tournaments;
}

export async function fetchMaincourtListPage(url: string): Promise<cheerio.Root> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const browser = await import('puppeteer').then((p) => p.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }));
      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        page.on('console', (msg) => {
          if (msg.type() === 'error' && msg.text().includes('JSON.parse')) {
            return;
          }
        });

        await page.goto(url, { waitUntil: 'load', timeout: 60000 });

        try {
          await page.waitForFunction(
            'parseInt(document.querySelector("#tournamentsCount")?.textContent || "0", 10) > 0 && document.querySelector(".tournamentslisting__card, [class*=\'tournament\']") !== null',
            { timeout: 25000 }
          );
        } catch {
          console.log('Tournaments may not have loaded, proceeding with current content');
        }

        const html = await page.content();
        return cheerio.load(html);
      } finally {
        await browser.close();
      }
    } catch (error) {
      lastError = error as Error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to fetch page after retries');
}

export async function scrapeMaincourtTournament(url: string): Promise<ScrapedTournament | null> {
  try {
    const $ = await fetchHtmlWithRetry(url);

    const nameRaw = $('.division__title').first().text();
    const name = sanitizeString(nameRaw.replace(/· Tournament Details$/, '').replace(/🏆/, '').trim());

    if (!name) {
      return null;
    }

    let location = '';
    let city = '';
    let state = '';

    const locationItem = $('.division__card__list__item').filter((_, el) => {
      return $(el).find('.icon-new-map-pin').length > 0;
    });

    if (locationItem.length > 0) {
      const mapLink = locationItem.find('a[href*="maps.google.com"]');
      if (mapLink.length > 0) {
        const href = mapLink.attr('href') || '';
        const match = href.match(/q=(.+)$/);
        if (match) {
          location = decodeURIComponent(match[1].trim());
        }
      }
      
      if (!location) {
        const venueLink = locationItem.find('.division__card__list__item__link');
        location =
          venueLink.length > 0
            ? sanitizeString(venueLink.text())
            : sanitizeString(locationItem.text());
      }
      
      const { city: c, state: s } = extractCityState(location);
      city = c;
      state = s;
    }

    let startDate = '';
    let endDate = '';

    const dateItem = $('.division__card__list__item').filter((_, el) => {
      return $(el).find('.icon-new-calendar').length > 0;
    });

    if (dateItem.length > 0) {
      const dateText = dateItem.text().trim();
      const dates = extractMaincourtDates(dateText);
      if (dates.startDate) {
        startDate = dates.startDate;
        endDate = dates.endDate || dates.startDate;
      }
    }

    let registrationUrl: string | undefined;
    const registerLinks = $('a[href*="register"], a:contains("Register")');
    if (registerLinks.length > 0) {
      const href = registerLinks.first().attr('href');
      if (href) {
        registrationUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      }
    }

    const skillLevels: string[] = [];

    const yellowBallItems = $('.divi__row__left__list').filter((_, el) => {
      return $(el).find('.icon-ball.yellow').length > 0;
    });

    yellowBallItems.each((_, el) => {
      const intervalText = $(el).text().trim();
      const extractedFromInterval = parseSkillInterval(intervalText);
      skillLevels.push(...extractedFromInterval);
    });

    if (skillLevels.length === 0) {
      const divisionTitles = $('.divi__list');
      divisionTitles.each((_, el) => {
        const titleElement = $(el).find('.divi__list__title');
        const titleText = titleElement.text().trim();
        const extractedFromTitle = extractMaincourtSkillLevel(titleText);
        skillLevels.push(...extractedFromTitle);
      });
    }

    if (skillLevels.length === 0) {
      const skillText = $('.divi__row__left__list .icon-ball').parent().text();
      const extractedSkills = parseSkillLevels(skillText);
      skillLevels.push(...extractedSkills);
    }

    const notesHtml = $('.division__notes__inner').first().html() || '';
    const descriptionText = notesHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    const description = sanitizeString(descriptionText, true);

    const imageUrl = $('#listing-hub-image').attr('src');

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
      imageUrl: imageUrl || undefined,
      registrationUrl,
    });
  } catch (error) {
    console.error(`Error scraping tournament page ${url}:`, error);
    return null;
  }
}

export function extractMaincourtDates(
  text: string
): { startDate: string | null; endDate: string | null } {
  const result = { startDate: null as string | null, endDate: null as string | null };

  const rangePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const rangeMatch = text.match(rangePattern);

  if (rangeMatch) {
    result.startDate = parseDate(rangeMatch[1]);
    result.endDate = parseDate(rangeMatch[2]);
    return result;
  }

  const singlePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const singleMatch = text.match(singlePattern);

  if (singleMatch) {
    result.startDate = parseDate(singleMatch[1]);
    result.endDate = result.startDate;
  }

  const monthRangePattern =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
  const monthRangeMatch = text.match(monthRangePattern);

  if (monthRangeMatch) {
    const startStr = `${monthRangeMatch[1]} ${monthRangeMatch[2]}, ${monthRangeMatch[3]}`;
    const endStr = `${monthRangeMatch[4]} ${monthRangeMatch[5]}, ${monthRangeMatch[6]}`;
    result.startDate = parseDate(startStr);
    result.endDate = parseDate(endStr);
    return result;
  }

  const dayOfWeekMonthRangePattern =
    /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
  const dayOfWeekMonthRangeMatch = text.match(dayOfWeekMonthRangePattern);

  if (dayOfWeekMonthRangeMatch) {
    const startStr = `${dayOfWeekMonthRangeMatch[1]} ${dayOfWeekMonthRangeMatch[2]}, ${dayOfWeekMonthRangeMatch[3]}`;
    const endStr = `${dayOfWeekMonthRangeMatch[4]} ${dayOfWeekMonthRangeMatch[5]}, ${dayOfWeekMonthRangeMatch[6]}`;
    result.startDate = parseDate(startStr);
    result.endDate = parseDate(endStr);
    return result;
  }

  const dayOfWeekMonthSinglePattern =
    /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
  const dayOfWeekMonthSingleMatch = text.match(dayOfWeekMonthSinglePattern);

  if (dayOfWeekMonthSingleMatch) {
    const startStr = `${dayOfWeekMonthSingleMatch[1]} ${dayOfWeekMonthSingleMatch[2]}, ${dayOfWeekMonthSingleMatch[3]}`;
    result.startDate = parseDate(startStr);
    result.endDate = result.startDate;
  }

  return result;
}

export function extractMaincourtSkillLevel(title: string): string[] {
  const levels: string[] = [];

  const match = title.match(/^([\d.]+)\+?\s/);
  if (match) {
    const baseLevel = match[1];

    if (title.includes('+')) {
      const baseIndex = ALL_SKILL_LEVELS.indexOf(baseLevel as typeof ALL_SKILL_LEVELS[number]);
      if (baseIndex !== -1) {
        levels.push(...ALL_SKILL_LEVELS.slice(baseIndex));
      } else {
        levels.push(baseLevel);
        levels.push('5.5');
      }
    } else {
      levels.push(baseLevel);
    }
  }

  return levels;
}

export function extractMaincourtJsonData($: cheerio.Root): { tournaments?: unknown[] } {
  const scripts = $('script');
  let jsonData: { tournaments?: unknown[] } = {};

  scripts.each((_, element) => {
    const content = $(element).html() || '';

    const nextDataMatch = content.match(/window\.__NEXT_DATA__\s*=\s*(\{.*?\})/);
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1]);
        if (data.props?.pageProps) {
          const pageProps = data.props.pageProps;
          if (pageProps.tournaments) {
            jsonData.tournaments = pageProps.tournaments;
          } else if (pageProps.initialData?.tournaments) {
            jsonData.tournaments = pageProps.initialData.tournaments;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    const ssrDataMatch = content.match(/window\.__SSR_DATA__\s*=\s*(\{.*?\})/);
    if (ssrDataMatch) {
      try {
        const data = JSON.parse(ssrDataMatch[1]);
        if (data.tournaments) {
          jsonData.tournaments = data.tournaments;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  return jsonData;
}

export function parseMaincourtJsonTournament(t: unknown): ScrapedTournament | null {
  if (!t || typeof t !== 'object') return null;

  const tournament = t as Record<string, unknown>;
  const name = sanitizeString(
    (tournament.name as string) || (tournament.title as string)
  );
  const sourceUrl = sanitizeString(
    (tournament.url as string) ||
      (tournament.link as string) ||
      (tournament.slug as string)
  );

  if (!name || !sourceUrl) return null;

  const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`;

  let location = '';
  let city = '';
  let state = '';

  const venue = (tournament.venue as string) || (tournament.location as string) || '';
  const cityStr = (tournament.city as string) || '';
  const stateStr = (tournament.state as string) || '';

  location = [venue, cityStr, stateStr].filter(Boolean).join(', ');
  const cs = extractCityState(location);
  city = cs.city || cityStr;
  state = cs.state || stateStr;

  let startDate = '';
  let endDate = '';

  const startDateVal =
    (tournament.startDate as string) ||
    (tournament.start_date as string) ||
    (tournament.date as string);
  const endDateVal = (tournament.endDate as string) || (tournament.end_date as string);

  if (startDateVal) {
    const parsedStart = parseDate(startDateVal);
    const parsedEnd = endDateVal ? parseDate(endDateVal) : null;
    startDate = parsedStart || '';
    endDate = parsedEnd || parsedStart || '';
  }

  const skillLevels = parseSkillLevels(JSON.stringify(tournament));

  const description = sanitizeString(
    (tournament.description as string) || (tournament.details as string)
  );

  let registrationUrl: string | undefined;
  const regUrl =
    (tournament.registrationUrl as string) ||
    (tournament.registration_url as string) ||
    (tournament.registerUrl as string);
  if (regUrl) {
    registrationUrl = regUrl.startsWith('http') ? regUrl : `${BASE_URL}${regUrl}`;
  }

  return createTournament(SOURCE_NAME, {
    name,
    sourceUrl: fullUrl,
    location,
    city,
    state,
    startDate,
    endDate,
    skillLevels,
    description,
    registrationUrl,
  });
}

export const maincourtScraper: Scraper = {
  sourceName: SOURCE_NAME,
  baseUrl: BASE_URL,
  scrape: scrapeMaincourt,
};

export default scrapeMaincourt;
