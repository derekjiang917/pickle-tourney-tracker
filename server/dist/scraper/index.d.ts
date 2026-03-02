import { Browser, Page } from 'puppeteer';
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
declare const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
declare function launchBrowser(): Promise<Browser>;
declare function createPage(browser: Browser, url: string): Promise<Page>;
declare function parseDate(dateStr: string): Date | null;
declare function parseSkillLevels(skillLevelsText: string): string[];
declare function extractCityState(locationStr: string): {
    city: string;
    state: string;
};
declare function fetchPageContent(url: string): Promise<string>;
declare function fetchPageWithPuppeteer(url: string, selector: string): Promise<cheerio.Root>;
declare function scrapeWithRetry(url: string, maxRetries?: number, delayMs?: number): Promise<string>;
export interface Scraper {
    sourceName: string;
    baseUrl: string;
    scrape(): Promise<ScrapedTournament[]>;
}
declare class ScraperOrchestrator {
    private scrapers;
    register(scraper: Scraper): void;
    getScraper(name: string): Scraper | undefined;
    getRegisteredSources(): string[];
    scrapeAll(): Promise<ScrapeResult[]>;
    scrapeSource(sourceName: string): Promise<ScrapeResult>;
}
declare const orchestrator: ScraperOrchestrator;
export { launchBrowser, createPage, parseDate, parseSkillLevels, extractCityState, fetchPageContent, fetchPageWithPuppeteer, scrapeWithRetry, orchestrator, ScraperOrchestrator, DEFAULT_USER_AGENT, };
//# sourceMappingURL=index.d.ts.map