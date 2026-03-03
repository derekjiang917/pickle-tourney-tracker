import { ScrapedTournament, Scraper } from './types.js';
export declare const SOURCE_NAME_MAINCOURT = "maincourt.com";
export declare const BASE_URL_MAINCOURT = "https://maincourt.com";
export declare function scrapeMaincourt(): Promise<ScrapedTournament[]>;
export declare function fetchMaincourtListPage(url: string): Promise<cheerio.Root>;
export declare function scrapeMaincourtTournament(url: string): Promise<ScrapedTournament | null>;
export declare function extractMaincourtDates(text: string): {
    startDate: Date | null;
    endDate: Date | null;
};
export declare function extractMaincourtSkillLevel(title: string): string[];
export declare function extractMaincourtJsonData($: cheerio.Root): {
    tournaments?: unknown[];
};
export declare function parseMaincourtJsonTournament(t: unknown): ScrapedTournament | null;
export declare const maincourtScraper: Scraper;
export default scrapeMaincourt;
//# sourceMappingURL=maincourt.d.ts.map