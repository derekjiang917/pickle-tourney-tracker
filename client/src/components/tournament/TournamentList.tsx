import { useState, useEffect } from 'react';
import { Tournament } from '@/types/tournament';
import { fetchTournaments, TournamentFilters } from '@/lib/api';
import { TournamentCard, TournamentCardSkeleton } from './TournamentCard';
import { TournamentModal } from './TournamentModal';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';
import { FilterState } from '@/components/filters/FilterPanel';

const ITEMS_PER_PAGE = 12;

interface TournamentListProps {
  filters: FilterState;
  currentPage: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

interface ScrapeStatus {
  lastRun: {
    endTime: string;
  } | null;
}

export function TournamentList({ 
  filters, 
  currentPage, 
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiFilters: TournamentFilters = {
          location: filters.location || undefined,
          date: filters.date || undefined,
          skillLevels: filters.skillLevels.length > 0 ? filters.skillLevels : undefined,
          upcomingOnly: filters.upcomingOnly,
        };
        
        const response = await fetchTournaments({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          filters: apiFilters,
        });
        setTournaments(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [filters, currentPage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <TournamentCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-destructive">Error: {error}</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <SearchX className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No tournaments found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {hasActiveFilters 
            ? "We couldn't find any tournaments matching your current filters. Try adjusting your search criteria."
            : "There are no tournaments available at the moment. Check back later!"
          }
        </p>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tournaments.map((tournament) => (
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament} 
            onSelect={(t) => {
              setSelectedTournament(t);
              setModalOpen(true);
            }}
          />
        ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
      />

      <TournamentModal
        tournament={selectedTournament}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

export async function fetchScrapeStatus(): Promise<ScrapeStatus> {
  const response = await fetch('http://localhost:3001/api/scrape/status');
  if (!response.ok) {
    throw new Error('Failed to fetch scrape status');
  }
  return response.json();
}
