import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('./prisma/dev.db');
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
    skillLevels: JSON.stringify(['3.0', '3.5', '4.0', '4.5']),
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
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5']),
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
    skillLevels: JSON.stringify(['All Levels']),
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
    skillLevels: JSON.stringify(['3.0', '3.5', '4.0', '4.5', '5.0']),
    description: 'Premier Pacific Northwest tournament with cash prizes.',
  },
  {
    name: 'Florida State Championships',
    sourceUrl: 'https://example.com/tournament5',
    source: 'Florida Pickleball',
    location: 'Bradenton Sports Complex',
    city: 'Bradenton',
    state: 'FL',
    startDate: new Date('2026-07-20'),
    endDate: new Date('2026-07-25'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0', '4.5', '5.0']),
    description: 'State championships with over 200 teams expected.',
  },
  {
    name: 'Labor Day Weekend Tournament',
    sourceUrl: 'https://example.com/tournament6',
    source: 'PickleballTournaments.com',
    location: 'Central Park Courts',
    city: 'San Diego',
    state: 'CA',
    startDate: new Date('2026-09-05'),
    endDate: new Date('2026-09-07'),
    skillLevels: JSON.stringify(['3.0', '3.5', '4.0']),
    description: 'Annual Labor Day tournament with beach activities.',
  },
  {
    name: 'Spring Fling Tournament',
    sourceUrl: 'https://example.com/tournament7',
    source: 'USAPA',
    location: 'Nashville Sports Complex',
    city: 'Nashville',
    state: 'TN',
    startDate: new Date('2026-04-20'),
    endDate: new Date('2026-04-22'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0']),
    description: 'Music City spring tournament with live entertainment between matches.',
  },
  {
    name: 'New England Fall Classic',
    sourceUrl: 'https://example.com/tournament8',
    source: 'New England Pickleball',
    location: 'Boston Athletic Club',
    city: 'Boston',
    state: 'MA',
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-17'),
    skillLevels: JSON.stringify(['3.5', '4.0', '4.5', '5.0']),
    description: 'Fall classic in historic Boston with championship finals on Sunday.',
  },
  {
    name: 'Texas Heat Summer Slam',
    sourceUrl: 'https://example.com/tournament9',
    source: 'Texas Pickleball Association',
    location: 'Houston Sports Arena',
    city: 'Houston',
    state: 'TX',
    startDate: new Date('2026-08-10'),
    endDate: new Date('2026-08-12'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0', '4.5']),
    description: 'Beat the heat with our annual summer slam. Indoor courts with AC.',
  },
  {
    name: 'Midwest Madness',
    sourceUrl: 'https://example.com/tournament10',
    source: 'Midwest Pickleball League',
    location: 'Chicago Sports Center',
    city: 'Chicago',
    state: 'IL',
    startDate: new Date('2026-05-30'),
    endDate: new Date('2026-06-01'),
    skillLevels: JSON.stringify(['3.0', '3.5', '4.0']),
    description: 'Windy City tournament featuring the best players from the Midwest.',
  },
  {
    name: 'Mountain View Open',
    sourceUrl: 'https://example.com/tournament11',
    source: 'USAPA',
    location: 'Denver Pickleball Complex',
    city: 'Denver',
    state: 'CO',
    startDate: new Date('2026-07-15'),
    endDate: new Date('2026-07-17'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0', '4.5', '5.0']),
    description: 'Tournament with a view! Play at 5000 feet elevation.',
  },
  {
    name: 'East Coast Classic',
    sourceUrl: 'https://example.com/tournament12',
    source: 'East Coast Pickleball',
    location: 'Virginia Beach Convention Center',
    city: 'Virginia Beach',
    state: 'VA',
    startDate: new Date('2026-09-25'),
    endDate: new Date('2026-09-27'),
    skillLevels: JSON.stringify(['3.0', '3.5', '4.0', '4.5']),
    description: 'Beachside tournament combining competitive play with relaxation.',
  },
  {
    name: 'Cactus Country Championship',
    sourceUrl: 'https://example.com/tournament13',
    source: 'Arizona Pickleball Association',
    location: 'Tucson Desert Courts',
    city: 'Tucson',
    state: 'AZ',
    startDate: new Date('2026-11-10'),
    endDate: new Date('2026-11-12'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0']),
    description: 'Desert championship with perfect weather and stunning sunsets.',
  },
  {
    name: 'Northern Lights Invitational',
    sourceUrl: 'https://example.com/tournament14',
    source: 'Canadian Pickleball Association',
    location: 'Vancouver Indoor Facility',
    city: 'Vancouver',
    state: 'BC',
    startDate: new Date('2026-02-20'),
    endDate: new Date('2026-02-22'),
    skillLevels: JSON.stringify(['3.5', '4.0', '4.5', '5.0']),
    description: 'Prestigious invitational tournament with top Canadian and US players.',
  },
  {
    name: 'Georgia Peach Open',
    sourceUrl: 'https://example.com/tournament15',
    source: 'Georgia Pickleball Federation',
    location: 'Atlanta Tennis Center',
    city: 'Atlanta',
    state: 'GA',
    startDate: new Date('2026-03-28'),
    endDate: new Date('2026-03-30'),
    skillLevels: JSON.stringify(['2.5', '3.0', '3.5', '4.0', '4.5']),
    description: 'Peach State championship with Southern hospitality and great prizes.',
  },
];

async function main() {
  console.log('Starting database seed...');

  await prisma.tournament.deleteMany();
  console.log('Cleared existing tournaments');

  for (const tournament of tournaments) {
    await prisma.tournament.create({
      data: tournament,
    });
    console.log(`Created tournament: ${tournament.name}`);
  }

  console.log(`Seeded ${tournaments.length} tournaments successfully`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
