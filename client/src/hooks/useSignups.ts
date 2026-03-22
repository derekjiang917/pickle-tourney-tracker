import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

export interface Registration {
  id: string;
  tournamentId: string;
  status: 'PENDING' | 'CONFIRMED';
  clickedAt: string;
  confirmedAt: string | null;
  tournament: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    city: string;
    state: string;
    imageUrl: string | null;
  };
}

export interface ConflictInfo {
  tournamentId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function useSignups() {
  const { isAuthenticated } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pending, setPending] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    if (!isAuthenticated) {
      setRegistrations([]);
      setPending([]);
      return;
    }
    setIsLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        fetch('/api/signups', { credentials: 'include' }),
        fetch('/api/signups/pending', { credentials: 'include' }),
      ]);
      const allData = await allRes.json() as { registrations: Registration[] };
      const pendingData = await pendingRes.json() as { pending: Registration[] };
      setRegistrations(allData.registrations);
      setPending(pendingData.pending);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchRegistrations();
  }, [fetchRegistrations]);

  const recordClick = useCallback(async (tournamentId: string) => {
    if (!isAuthenticated) return;
    await fetch('/api/signups/click', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId }),
    });
    await fetchRegistrations();
  }, [isAuthenticated, fetchRegistrations]);

  const confirm = useCallback(async (tournamentId: string) => {
    await fetch(`/api/signups/${tournamentId}/confirm`, {
      method: 'PATCH',
      credentials: 'include',
    });
    await fetchRegistrations();
  }, [fetchRegistrations]);

  const decline = useCallback(async (tournamentId: string) => {
    await fetch(`/api/signups/${tournamentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await fetchRegistrations();
  }, [fetchRegistrations]);

  const checkConflicts = useCallback(async (tournamentId: string): Promise<ConflictInfo[]> => {
    if (!isAuthenticated) return [];
    const res = await fetch(`/api/signups/conflicts/${tournamentId}`, { credentials: 'include' });
    const data = await res.json() as { conflicts: ConflictInfo[] };
    return data.conflicts;
  }, [isAuthenticated]);

  const getStatusForTournament = useCallback(
    (tournamentId: string): 'CONFIRMED' | 'PENDING' | null => {
      const reg = registrations.find((r) => r.tournamentId === tournamentId);
      return reg?.status ?? null;
    },
    [registrations]
  );

  return {
    registrations,
    pending,
    isLoading,
    recordClick,
    confirm,
    decline,
    checkConflicts,
    getStatusForTournament,
    refetch: fetchRegistrations,
  };
}
