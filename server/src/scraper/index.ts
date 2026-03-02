import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapedTournament {
  name: string;
  sourceUrl: string;
  source: string;
  location: string;
  city: string;
  state: string;
  startDate: Date;
  endDate: Date;
  skillLevels: string[];
  description?: string;
  registrationUrl?: string;
}

export interface ScrapeResult {
  success: boolean;
  source: string;
  tournaments: ScrapedTournament[];
  error?: string;
  timestamp: Date;
}

export interface ScrapeLogData {
  id?: string;
  source: string;
  startTime: Date;
  endTime?: Date;
  tournamentsFound: number;
  errors: string;
  status: 'running' | 'completed' | 'failed';
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function createPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(DEFAULT_USER_AGENT);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return page;
}

function parseDate(dateStr: string): Date | null {
  const cleaned = dateStr.trim();
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseSkillLevels(skillLevelsText: string): string[] {
  const levels: string[] = [];
  const patterns = [
    /\b(1\.0|2\.0|3\.0|3\.5|4\.0|4\.5|5\.0|5\.5|6\.0)\b/gi,
    /\b(Beginner|Intermediate|Advanced|Expert|Open|Pro)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = skillLevelsText.match(pattern);
    if (matches) {
      levels.push(...matches.map((m) => m.toUpperCase()));
    }
  }

  return [...new Set(levels)];
}

function extractCityState(locationStr: string): { city: string; state: string } {
  const parts = locationStr.split(',').map((p) => p.trim());
  
  if (parts.length >= 2) {
    const state = parts[parts.length - 1].trim();
    const city = parts[parts.length - 2].trim();
    return { city, state };
  }

  return { city: '', state: '' };
}

async function fetchPageContent(url: string): Promise<string> {
  const browser = await launchBrowser();
  try {
    const page = await createPage(browser, url);
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

async function fetchPageWithPuppeteer(
  url: string,
  selector: string
): Promise<cheerio.Root> {
  const browser = await launchBrowser();
  try {
    const page = await createPage(browser, url);
    await page.waitForSelector(selector, { timeout: 10000 });
    const html = await page.content();
    return cheerio.load(html);
  } finally {
    await browser.close();
  }
}

async function scrapeWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchPageContent(url);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to fetch page after retries');
}

export interface Scraper {
  sourceName: string;
  baseUrl: string;
  scrape(): Promise<ScrapedTournament[]>;
}

class ScraperOrchestrator {
  private scrapers: Map<string, Scraper> = new Map();

  register(scraper: Scraper): void {
    this.scrapers.set(scraper.sourceName, scraper);
  }

  getScraper(name: string): Scraper | undefined {
    return this.scrapers.get(name);
  }

  getRegisteredSources(): string[] {
    return Array.from(this.scrapers.keys());
  }

  async scrapeAll(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const [name, scraper] of this.scrapers) {
      const result: ScrapeResult = {
        success: false,
        source: name,
        tournaments: [],
        timestamp: new Date(),
      };

      try {
        const tournaments = await scraper.scrape();
        result.success = true;
        result.tournaments = tournaments;
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(result);
    }

    return results;
  }

  async scrapeSource(sourceName: string): Promise<ScrapeResult> {
    const scraper = this.scrapers.get(sourceName);

    const result: ScrapeResult = {
      success: false,
      source: sourceName,
      tournaments: [],
      timestamp: new Date(),
    };

    if (!scraper) {
      result.error = `No scraper registered for source: ${sourceName}`;
      return result;
    }

    try {
      const tournaments = await scraper.scrape();
      result.success = true;
      result.tournaments = tournaments;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }
}

const orchestrator = new ScraperOrchestrator();

export {
  launchBrowser,
  createPage,
  parseDate,
  parseSkillLevels,
  extractCityState,
  fetchPageContent,
  fetchPageWithPuppeteer,
  scrapeWithRetry,
  orchestrator,
  ScraperOrchestrator,
  DEFAULT_USER_AGENT,
};
