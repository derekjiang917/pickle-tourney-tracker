import { ScrapedTournament } from './types.js';
export declare const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export declare function parseDate(dateStr: string): Date | null;
export declare function toPacificTime(date: Date): Date;
export declare function parseSkillLevels(skillLevelsText: string): string[];
export declare function extractCityState(locationStr: string): {
    city: string;
    state: string;
};
export declare function sanitizeString(str: string | undefined | null, preserveNewlines?: boolean): string;
export declare function extractDomain(url: string): string;
export declare function createTournament(sourceName: string, data: Partial<ScrapedTournament>): ScrapedTournament;
//# sourceMappingURL=utils.d.ts.map