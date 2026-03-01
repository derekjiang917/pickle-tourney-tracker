import { Scraper } from './base.js';
import { PickleballTournamentsScraper } from './pickleballtournaments.js';
import { MaincourtScraper } from './maincourt.js';

interface ScraperRegistry {
  getScraper(name: string): Scraper | undefined;
  getAllScrapers(): Scraper[];
  getSourceNames(): string[];
}

class ScraperRegistryImpl implements ScraperRegistry {
  private scrapers: Map<string, Scraper> = new Map();

  constructor() {
    this.registerDefaultScrapers();
  }

  private registerDefaultScrapers(): void {
    const scrapers: Scraper[] = [
      new PickleballTournamentsScraper(),
      new MaincourtScraper(),
    ];

    for (const scraper of scrapers) {
      this.scrapers.set(scraper.sourceName, scraper);
    }
  }

  register(scraper: Scraper): void {
    this.scrapers.set(scraper.sourceName, scraper);
  }

  getScraper(name: string): Scraper | undefined {
    return this.scrapers.get(name);
  }

  getAllScrapers(): Scraper[] {
    return Array.from(this.scrapers.values());
  }

  getSourceNames(): string[] {
    return Array.from(this.scrapers.keys());
  }
}

const registry = new ScraperRegistryImpl();

export { registry, ScraperRegistry, ScraperRegistryImpl };
