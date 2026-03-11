import { Browser, Page } from 'puppeteer';
export declare function launchBrowser(): Promise<Browser>;
export declare function createPage(browser: Browser, url: string): Promise<Page>;
export declare function fetchHtml(url: string): Promise<cheerio.Root>;
export declare function fetchHtmlWithRetry(url: string, maxRetries?: number, delayMultiplier?: number): Promise<cheerio.Root>;
export declare function fetchPageContent(url: string): Promise<string>;
export declare function scrapeWithRetry(url: string, maxRetries?: number, delayMs?: number): Promise<string>;
//# sourceMappingURL=puppeteer.d.ts.map