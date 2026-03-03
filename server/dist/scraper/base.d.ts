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
export interface Scraper {
    readonly sourceName: string;
    readonly baseUrl: string;
    scrape(): Promise<ScrapedTournament[]>;
}
export declare const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export declare function parseDate(dateStr: string): Date | null;
export declare function toPacificTime(date: Date): Date;
export declare function parseSkillLevels(skillLevelsText: string): string[];
export declare function extractCityState(locationStr: string): {
    city: string;
    state: string;
};
export declare function sanitizeString(str: string | undefined | null): string;
export declare function extractDomain(url: string): string;
export declare abstract class BaseScraper implements Scraper {
    abstract readonly sourceName: string;
    abstract readonly baseUrl: string;
    protected browser: Browser | null;
    abstract scrape(): Promise<ScrapedTournament[]>;
    protected launchBrowser(): Promise<Browser>;
    protected createPage(url: string): Promise<Page>;
    protected fetchHtml(url: string): Promise<cheerio.Root>;
    protected closeBrowser(): Promise<void>;
    protected createTournament(data: Partial<ScrapedTournament>): ScrapedTournament;
}
//# sourceMappingURL=base.d.ts.map