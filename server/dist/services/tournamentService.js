import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
function parseSkillLevels(skillLevelsStr) {
    try {
        return JSON.parse(skillLevelsStr);
    }
    catch {
        return [];
    }
}
function matchesSkillLevels(tournamentSkillLevels, filterSkillLevels) {
    const levels = parseSkillLevels(tournamentSkillLevels);
    return filterSkillLevels.some((level) => levels.includes(level));
}
export async function getTournaments({ skip, take, filters, }) {
    const where = {};
    if (filters.location) {
        const locationSearch = filters.location.toLowerCase();
        where.OR = [
            { city: { contains: locationSearch } },
            { state: { contains: locationSearch } },
            { location: { contains: locationSearch } },
        ];
    }
    if (filters.startDate || filters.endDate) {
        where.startDate = {};
        if (filters.startDate) {
            where.startDate.gte = filters.startDate;
        }
        if (filters.endDate) {
            where.startDate.lte = filters.endDate;
        }
    }
    let allTournaments = await prisma.tournament.findMany({
        where,
        orderBy: { startDate: 'asc' },
    });
    if (filters.skillLevels && filters.skillLevels.length > 0) {
        allTournaments = allTournaments.filter((t) => matchesSkillLevels(t.skillLevels, filters.skillLevels));
    }
    const total = allTournaments.length;
    const tournaments = allTournaments.slice(skip, skip + take);
    return { tournaments, total };
}
export async function getTournamentById(id) {
    return prisma.tournament.findUnique({
        where: { id },
    });
}
export async function upsertTournaments(tournaments) {
    const result = {
        created: 0,
        updated: 0,
        errors: [],
    };
    await prisma.$transaction(async (tx) => {
        for (const tournament of tournaments) {
            try {
                const existing = await tx.tournament.findFirst({
                    where: { sourceUrl: tournament.sourceUrl },
                });
                if (existing) {
                    await tx.tournament.update({
                        where: { id: existing.id },
                        data: {
                            name: tournament.name,
                            location: tournament.location,
                            city: tournament.city,
                            state: tournament.state,
                            startDate: tournament.startDate,
                            endDate: tournament.endDate,
                            skillLevels: JSON.stringify(tournament.skillLevels),
                            description: tournament.description,
                        },
                    });
                    result.updated++;
                }
                else {
                    await tx.tournament.create({
                        data: {
                            name: tournament.name,
                            sourceUrl: tournament.sourceUrl,
                            source: tournament.source,
                            location: tournament.location,
                            city: tournament.city,
                            state: tournament.state,
                            startDate: tournament.startDate,
                            endDate: tournament.endDate,
                            skillLevels: JSON.stringify(tournament.skillLevels),
                            description: tournament.description,
                        },
                    });
                    result.created++;
                }
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`Failed to upsert ${tournament.name}: ${msg}`);
            }
        }
    });
    return result;
}
export default prisma;
//# sourceMappingURL=tournamentService.js.map