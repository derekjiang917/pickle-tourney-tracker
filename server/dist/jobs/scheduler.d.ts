import { ScrapeLog } from '@prisma/client';
export interface ScrapeJobResult {
    success: boolean;
    tournamentsFound: number;
    tournamentsCreated: number;
    tournamentsUpdated: number;
    errors: string[];
    duration: number;
}
export declare function runScrapeJob(): Promise<ScrapeJobResult>;
export declare function startScheduler(): void;
export declare function stopScheduler(): void;
export declare function getLastScrapeStatus(): Promise<ScrapeLog | null>;
export declare function getScrapeHistory(limit?: number): Promise<ScrapeLog[]>;
export declare function isJobRunning(): boolean;
//# sourceMappingURL=scheduler.d.ts.map