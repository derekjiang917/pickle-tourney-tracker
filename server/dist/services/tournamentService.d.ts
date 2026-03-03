import { PrismaClient, Tournament } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
declare const prisma: PrismaClient<{
    adapter: PrismaBetterSqlite3;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
export interface TournamentFilters {
    location?: string;
    startDate?: Date;
    endDate?: Date;
    skillLevels?: string[];
}
export interface GetTournamentsParams {
    skip: number;
    take: number;
    filters: TournamentFilters;
}
export interface GetTournamentsResult {
    tournaments: Tournament[];
    total: number;
}
export declare function getTournaments({ skip, take, filters, }: GetTournamentsParams): Promise<GetTournamentsResult>;
export declare function getTournamentById(id: string): Promise<Tournament | null>;
export interface ScrapedTournamentInput {
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
export declare function upsertTournaments(tournaments: ScrapedTournamentInput[]): Promise<{
    created: number;
    updated: number;
    errors: string[];
}>;
export default prisma;
//# sourceMappingURL=tournamentService.d.ts.map