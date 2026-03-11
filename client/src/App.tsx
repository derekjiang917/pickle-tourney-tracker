import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TournamentList, fetchScrapeStatus } from '@/components/tournament/TournamentList';
import { useTournamentFilters } from '@/hooks/useTournamentFilters';

function App() {
  const { filters, page, setFilters, setPage, clearFilters } = useTournamentFilters();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const loadScrapeStatus = async () => {
      try {
        const status = await fetchScrapeStatus();
        if (status.lastRun?.endTime) {
          setLastUpdated(status.lastRun.endTime);
        }
      } catch (err) {
        console.error('Failed to fetch scrape status:', err);
      }
    };

    loadScrapeStatus();
    const interval = setInterval(loadScrapeStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const hasActiveFilters = Boolean(filters.location || filters.date || filters.skillLevels.length > 0);

  return (
    <DashboardLayout
      filters={filters}
      onFiltersChange={setFilters}
      onClearFilters={clearFilters}
      lastUpdated={lastUpdated}
    >
      <TournamentList
        filters={filters}
        currentPage={page}
        onPageChange={setPage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </DashboardLayout>
  );
}

export default App;
