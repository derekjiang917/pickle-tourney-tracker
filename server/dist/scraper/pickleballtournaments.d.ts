import { BaseScraper, ScrapedTournament } from './base.js';
export declare class PickleballTournamentsScraper extends BaseScraper {
    readonly sourceName = "pickleballtournaments.com";
    readonly baseUrl = "https://pickleballtournaments.com";
    scrape(): Promise<ScrapedTournament[]>;
    private fetchHtmlWithRetry;
    private scrapeTournamentPage;
    private extractDates;
    private extractJsonData;
    private parseJsonTournament;
}
export default PickleballTournamentsScraper;
//# sourceMappingURL=pickleballtournaments.d.ts.map