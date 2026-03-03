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
    const startDateFilter = filters.startDate ? new Date(filters.startDate) : null;
    const endDateFilter = filters.endDate ? new Date(filters.endDate) : null;
    
    where.startDate = {};
    
    if (startDateFilter && endDateFilter) {
      const filterStart = new Date(Date.UTC(startDateFilter.getFullYear(), startDateFilter.getMonth(), startDateFilter.getDate(), 0, 0, 0, 0));
      const filterEnd = new Date(Date.UTC(endDateFilter.getFullYear(), endDateFilter.getMonth(), endDateFilter.getDate(), 23, 59, 59, 999));
      where.startDate.gte = filterStart;
      where.startDate.lte = filterEnd;
    } else if (startDateFilter) {
      const filterStart = new Date(Date.UTC(startDateFilter.getFullYear(), startDateFilter.getMonth(), startDateFilter.getDate(), 0, 0, 0, 0));
      where.startDate.gte = filterStart;
    } else if (endDateFilter) {
      const filterEnd = new Date(Date.UTC(endDateFilter.getFullYear(), endDateFilter.getMonth(), endDateFilter.getDate(), 23, 59, 59, 999));
      where.startDate.lte = filterEnd;
    }
  }

  if (filters.skillLevels && filters.skillLevels.length > 0) {
    where.skillLevels = {
      some: {
        skillLevel: { in: filters.skillLevels },
      },
    };
  }

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { startDate: 'asc' },
      skip,
      take,
      include: {
        skillLevels: true,
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  return { tournaments, total };
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      skillLevels: true,
    },
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
  imageUrl?: string;
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

        const skillLevelsData = tournament.skillLevels.map((level) => ({
          skillLevel: level,
        }));

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
              description: tournament.description,
              imageUrl: tournament.imageUrl,
              skillLevels: {
                deleteMany: {},
                create: skillLevelsData,
              },
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
              description: tournament.description,
              imageUrl: tournament.imageUrl,
              skillLevels: {
                create: skillLevelsData,
              },
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
