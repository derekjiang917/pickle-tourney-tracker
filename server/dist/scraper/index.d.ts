import { ScrapedTournament, Scraper, ScrapeResult } from './types.js';
import { launchBrowser, createPage, fetchHtml, fetchPageContent, scrapeWithRetry } from './puppeteer.js';
import { parseDate, parseSkillLevels, extractCityState, sanitizeString, extractDomain, toPacificTime, DEFAULT_USER_AGENT, createTournament } from './utils.js';
import { registry } from './registry.js';
declare class ScraperOrchestrator {
    private scrapers;
    register(scraper: Scraper): void;
    getScraper(name: string): Scraper | undefined;
    getRegisteredSources(): string[];
    scrapeAll(): Promise<ScrapeResult[]>;
    scrapeSource(sourceName: string): Promise<ScrapeResult>;
}
declare const orchestrator: ScraperOrchestrator;
export { launchBrowser, createPage, fetchHtml, fetchPageContent, scrapeWithRetry, parseDate, parseSkillLevels, extractCityState, sanitizeString, extractDomain, toPacificTime, createTournament, orchestrator, ScraperOrchestrator, DEFAULT_USER_AGENT, registry, };
export type { ScrapedTournament, Scraper, ScrapeResult };
//# sourceMappingURL=index.d.ts.map