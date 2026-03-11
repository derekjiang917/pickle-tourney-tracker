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
    imageUrl?: string;
    registrationUrl?: string;
}
export interface Scraper {
    sourceName: string;
    baseUrl: string;
    scrape(): Promise<ScrapedTournament[]>;
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
//# sourceMappingURL=types.d.ts.map