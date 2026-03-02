import { BaseScraper, ScrapedTournament } from './base.js';
export declare class MaincourtScraper extends BaseScraper {
    readonly sourceName = "maincourt.com";
    readonly baseUrl = "https://www.maincourt.com";
    scrape(): Promise<ScrapedTournament[]>;
    private fetchHtmlWithRetry;
    private scrapeTournamentPage;
    private extractDates;
    private extractJsonData;
    private parseJsonTournament;
}
export default MaincourtScraper;
//# sourceMappingURL=maincourt.d.ts.map