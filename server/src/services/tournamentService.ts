import { PrismaClient, Tournament, Prisma } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export interface TournamentFilters {
  location?: string;
  date?: string;
  skillLevels?: string[];
  upcomingOnly?: boolean;
  ids?: string[];
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

  if (filters.ids && filters.ids.length > 0) {
    where.id = { in: filters.ids };
  }

  if (filters.location) {
    const locationSearch = filters.location.toLowerCase();
    where.OR = [
      { city: { contains: locationSearch } },
      { state: { contains: locationSearch } },
      { location: { contains: locationSearch } },
    ];
  }

  if (filters.date) {
    where.startDate = {
      lte: filters.date,
    };
    where.endDate = {
      gte: filters.date,
    };
  } else if (filters.upcomingOnly) {
    const today = new Date().toISOString().slice(0, 10);
    where.endDate = { gte: today };
  }

  if (filters.skillLevels && filters.skillLevels.length > 0) {
    const levelValues = filters.skillLevels;
    const has5_0Plus = levelValues.includes('5.0+');
    const numericLevels = levelValues.filter((l) => l !== '5.0+');

    where.skillLevels = {
      some: {
        OR: [
          { skillLevel: { in: numericLevels } },
          ...(has5_0Plus
            ? [
                { skillLevel: { in: ['5.0', '5.5', '6.0'] } },
              ]
            : []),
        ],
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
  startDate: string;
  endDate: string;
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
        const isNew = !(await tx.tournament.findUnique({
          where: { sourceUrl: tournament.sourceUrl },
          select: { id: true },
        }));

        const skillLevelsData = tournament.skillLevels.map((level) => ({
          skillLevel: level,
        }));

        const sharedData = {
          name: tournament.name,
          location: tournament.location,
          city: tournament.city,
          state: tournament.state,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          description: tournament.description,
          imageUrl: tournament.imageUrl,
        };

        await tx.tournament.upsert({
          where: { sourceUrl: tournament.sourceUrl },
          update: {
            ...sharedData,
            skillLevels: {
              deleteMany: {},
              create: skillLevelsData,
            },
          },
          create: {
            ...sharedData,
            sourceUrl: tournament.sourceUrl,
            source: tournament.source,
            skillLevels: {
              create: skillLevelsData,
            },
          },
        });

        if (isNew) result.created++;
        else result.updated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to upsert ${tournament.name}: ${msg}`);
      }
    }
  });

  return result;
}

export default prisma;
