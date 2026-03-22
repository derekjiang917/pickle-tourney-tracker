import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TournamentList, fetchScrapeStatus } from '@/components/tournament/TournamentList';
import { useTournamentFilters } from '@/hooks/useTournamentFilters';
import { useSignups } from '@/hooks/useSignups';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationConfirmPopup } from '@/components/signup/RegistrationConfirmPopup';

function App() {
  const { filters, page, setFilters, setPage, clearFilters } = useTournamentFilters();
  const { isAuthenticated } = useAuth();
  const { pending, confirm, decline } = useSignups();
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
    <>
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
      {isAuthenticated && (
        <RegistrationConfirmPopup
          pending={pending}
          onConfirm={confirm}
          onDecline={decline}
        />
      )}
    </>
  );
}

export default App;
