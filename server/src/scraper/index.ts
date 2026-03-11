import { ScrapedTournament, Scraper, ScrapeResult } from './types.js';
import {
  launchBrowser,
  createPage,
  fetchHtml,
  fetchPageContent,
  scrapeWithRetry,
} from './puppeteer.js';
import {
  parseDate,
  parseSkillLevels,
  parseSkillInterval,
  extractCityState,
  sanitizeString,
  extractDomain,
  DEFAULT_USER_AGENT,
  createTournament,
  ALL_SKILL_LEVELS,
} from './utils.js';
import { registry } from './registry.js';

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
  fetchHtml,
  fetchPageContent,
  scrapeWithRetry,
  parseDate,
  parseSkillLevels,
  parseSkillInterval,
  extractCityState,
  sanitizeString,
  extractDomain,
  createTournament,
  orchestrator,
  ScraperOrchestrator,
  DEFAULT_USER_AGENT,
  ALL_SKILL_LEVELS,
  registry,
};

export type { ScrapedTournament, Scraper, ScrapeResult };
