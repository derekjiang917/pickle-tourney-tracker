import { Tournament } from '@/types/tournament';
import { TournamentCard } from './TournamentCard';
import { Button } from '@/components/ui/button';

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Summer Classic Pickleball Tournament',
    sourceUrl: 'https://example.com/tournament1',
    source: 'PickleballTournaments.com',
    location: 'Sunset Sports Complex',
    city: 'Phoenix',
    state: 'AZ',
    startDate: '2026-03-15',
    endDate: '2026-03-17',
    skillLevels: ['3.0', '3.5', '4.0', '4.5'],
    description: 'Annual summer tournament featuring multiple skill divisions. Food vendors and prizes included.',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Winter Indoor Championship',
    sourceUrl: 'https://example.com/tournament2',
    source: 'USAPA',
    location: 'Indoor Sports Arena',
    city: 'Denver',
    state: 'CO',
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    skillLevels: ['2.5', '3.0', '3.5'],
    description: 'Indoor winter championship. All skill levels welcome.',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: '3',
    name: 'Memorial Day Mixed Doubles',
    sourceUrl: 'https://example.com/tournament3',
    source: 'PickleballTournaments.com',
    location: 'Riverside Courts',
    city: 'Austin',
    state: 'TX',
    startDate: '2026-05-24',
    endDate: '2026-05-26',
    skillLevels: ['All Levels'],
    description: 'Mixed doubles tournament open to all skill levels. Registration includes lunch.',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: '4',
    name: 'Pacific Northwest Open',
    sourceUrl: 'https://example.com/tournament4',
    source: 'USAPA',
    location: 'Seattle Tennis Center',
    city: 'Seattle',
    state: 'WA',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    skillLevels: ['3.0', '3.5', '4.0', '4.5', '5.0'],
    description: 'Premier Pacific Northwest tournament with cash prizes.',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: '5',
    name: 'Florida State Championships',
    sourceUrl: 'https://example.com/tournament5',
    source: 'Florida Pickleball',
    location: 'Bradenton Sports Complex',
    city: 'Bradenton',
    state: 'FL',
    startDate: '2026-07-20',
    endDate: '2026-07-25',
    skillLevels: ['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'],
    description: 'State championships with over 200 teams expected.',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: '6',
    name: 'Labor Day Weekend Tournament',
    sourceUrl: 'https://example.com/tournament6',
    source: 'PickleballTournaments.com',
    location: 'Central Park Courts',
    city: 'San Diego',
    state: 'CA',
    startDate: '2026-09-05',
    endDate: '2026-09-07',
    skillLevels: ['3.0', '3.5', '4.0'],
    description: 'Annual Labor Day tournament with beach activities.',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

const ITEMS_PER_PAGE = 4;

interface TournamentListProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function TournamentList({ currentPage = 1, onPageChange }: TournamentListProps) {
  const totalPages = Math.ceil(mockTournaments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTournaments = mockTournaments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedTournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
