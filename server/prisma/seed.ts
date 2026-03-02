import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const tournaments = [
  {
    name: 'Summer Classic Pickleball Tournament',
    sourceUrl: 'https://example.com/tournament1',
    source: 'PickleballTournaments.com',
    location: 'Sunset Sports Complex',
    city: 'Phoenix',
    state: 'AZ',
    startDate: new Date('2026-03-15'),
    endDate: new Date('2026-03-17'),
    skillLevels: ['3.0', '3.5', '4.0', '4.5'],
    description: 'Annual summer tournament featuring multiple skill divisions. Food vendors and prizes included.',
  },
  {
    name: 'Winter Indoor Championship',
    sourceUrl: 'https://example.com/tournament2',
    source: 'USAPA',
    location: 'Indoor Sports Arena',
    city: 'Denver',
    state: 'CO',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-02'),
    skillLevels: ['2.5', '3.0', '3.5'],
    description: 'Indoor winter championship. All skill levels welcome.',
  },
  {
    name: 'Memorial Day Mixed Doubles',
    sourceUrl: 'https://example.com/tournament3',
    source: 'PickleballTournaments.com',
    location: 'Riverside Courts',
    city: 'Austin',
    state: 'TX',
    startDate: new Date('2026-05-24'),
    endDate: new Date('2026-05-26'),
    skillLevels: ['All Levels'],
    description: 'Mixed doubles tournament open to all skill levels. Registration includes lunch.',
  },
  {
    name: 'Pacific Northwest Open',
    sourceUrl: 'https://example.com/tournament4',
    source: 'USAPA',
    location: 'Seattle Tennis Center',
    city: 'Seattle',
    state: 'WA',
    startDate: new Date('2026-06-10'),
    endDate: new Date('2026-06-12'),
    skillLevels: ['3.0', '3.5', '4.0', '4.5', '5.0'],
    description: 'Pacific Northwest largest open tournament.',
  },
  {
    name: 'East Coast Classic',
    sourceUrl: 'https://example.com/tournament5',
    source: 'PickleballTournaments.com',
    location: 'Virginia Beach Courts',
    city: 'Virginia Beach',
    state: 'VA',
    startDate: new Date('2026-07-15'),
    endDate: new Date('2026-07-17'),
    skillLevels: ['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'],
    description: 'Annual east coast classic with prize money.',
  },
  {
    name: 'Midwest Madness',
    sourceUrl: 'https://example.com/tournament6',
    source: 'USAPA',
    location: 'Chicago Sports Complex',
    city: 'Chicago',
    state: 'IL',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-02'),
    skillLevels: ['3.0', '3.5', '4.0'],
    description: 'Midwest largest tournament.',
  },
  {
    name: 'Southern Swing Tournament',
    sourceUrl: 'https://example.com/tournament7',
    source: 'PickleballTournaments.com',
    location: 'Nashville Sports Arena',
    city: 'Nashville',
    state: 'TN',
    startDate: new Date('2026-09-20'),
    endDate: new Date('2026-09-22'),
    skillLevels: ['2.5', '3.0', '3.5', '4.0'],
    description: 'Country music and pickleball!',
  },
  {
    name: 'Florida State Championships',
    sourceUrl: 'https://example.com/tournament8',
    source: 'USAPA',
    location: 'Orlando Tennis Center',
    city: 'Orlando',
    state: 'FL',
    startDate: new Date('2026-10-10'),
    endDate: new Date('2026-10-12'),
    skillLevels: ['3.5', '4.0', '4.5', '5.0'],
    description: 'Florida state championships with professional divisions.',
  },
  {
    name: 'Thanksgiving Turkey Trot',
    sourceUrl: 'https://example.com/tournament9',
    source: 'PickleballTournaments.com',
    location: 'Portland Community Center',
    city: 'Portland',
    state: 'OR',
    startDate: new Date('2026-11-28'),
    endDate: new Date('2026-11-29'),
    skillLevels: ['2.5', '3.0', '3.5', '4.0', '4.5'],
    description: 'Annual thanksgiving tournament.',
  },
  {
    name: 'Holiday Classic',
    sourceUrl: 'https://example.com/tournament10',
    source: 'USAPA',
    location: 'San Diego Sports Hall',
    city: 'San Diego',
    state: 'CA',
    startDate: new Date('2026-12-15'),
    endDate: new Date('2026-12-17'),
    skillLevels: ['3.0', '3.5', '4.0', '4.5'],
    description: 'Holiday tournament to end the year.',
  },
];

async function main() {
  console.log('Seeding database...');

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { sourceUrl: t.sourceUrl },
      update: {
        name: t.name,
        location: t.location,
        city: t.city,
        state: t.state,
        startDate: t.startDate,
        endDate: t.endDate,
        description: t.description,
        skillLevels: {
          deleteMany: {},
          create: t.skillLevels.map((level) => ({ skillLevel: level })),
        },
      },
      create: {
        name: t.name,
        sourceUrl: t.sourceUrl,
        source: t.source,
        location: t.location,
        city: t.city,
        state: t.state,
        startDate: t.startDate,
        endDate: t.endDate,
        description: t.description,
        skillLevels: {
          create: t.skillLevels.map((level) => ({ skillLevel: level })),
        },
      },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
