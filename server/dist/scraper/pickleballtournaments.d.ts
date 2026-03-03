import { ScrapedTournament, Scraper } from './types.js';
export declare const SOURCE_NAME_PICKLEBALLTOURNAMENTS = "pickleballtournaments.com";
export declare const BASE_URL_PICKLEBALLTOURNAMENTS = "https://pickleballtournaments.com";
export declare function scrapePickleballTournaments(): Promise<ScrapedTournament[]>;
export declare function scrapePickleballTournamentPage(url: string): Promise<ScrapedTournament | null>;
export declare function extractPickleballTournamentsDates(text: string): {
    startDate: Date | null;
    endDate: Date | null;
};
export declare function extractPickleballTournamentsJsonData($: cheerio.Root): {
    tournaments?: unknown[];
};
export declare function parsePickleballTournamentJson(t: unknown): ScrapedTournament | null;
export declare const pickleballTournamentsScraper: Scraper;
export default scrapePickleballTournaments;
//# sourceMappingURL=pickleballtournaments.d.ts.map