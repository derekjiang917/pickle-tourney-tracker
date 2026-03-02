import { PrismaClient, Tournament, Prisma } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

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

function parseSkillLevels(skillLevelsStr: string): string[] {
  try {
    return JSON.parse(skillLevelsStr);
  } catch {
    return [];
  }
}

function matchesSkillLevels(tournamentSkillLevels: string, filterSkillLevels: string[]): boolean {
  const levels = parseSkillLevels(tournamentSkillLevels);
  return filterSkillLevels.some((level) => levels.includes(level));
}

export async function getTournaments({
  skip,
  take,
  filters,
}: GetTournamentsParams): Promise<GetTournamentsResult> {
  const where: Prisma.TournamentWhereInput = {};

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
    allTournaments = allTournaments.filter((t) =>
      matchesSkillLevels(t.skillLevels as string, filters.skillLevels!)
    );
  }

  const total = allTournaments.length;
  const tournaments = allTournaments.slice(skip, skip + take);

  return { tournaments, total };
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  return prisma.tournament.findUnique({
    where: { id },
  });
}

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
  registrationUrl?: string;
}

export async function upsertTournaments(tournaments: ScrapedTournamentInput[]): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const result = {
    created: 0,
    updated: 0,
    errors: [] as string[],
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
        } else {
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
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to upsert ${tournament.name}: ${msg}`);
      }
    }
  });

  return result;
}

export default prisma;
