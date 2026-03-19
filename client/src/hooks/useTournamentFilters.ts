import { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterState } from '@/components/filters/FilterPanel';

export interface TournamentFiltersState {
  filters: FilterState;
  page: number;
  setFilters: (filters: FilterState) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  getQueryParams: () => URLSearchParams;
}

export function useTournamentFilters(): TournamentFiltersState {
  const [filters, setFiltersState] = useState<FilterState>({
    location: '',
    date: '',
    skillLevels: [],
    upcomingOnly: true,
  });
  const [page, setPageState] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const location = params.get('location') || '';
    const date = params.get('date') || '';
    const skillLevels = params.get('skillLevels')?.split(',').filter(Boolean) || [];
    const pageParam = parseInt(params.get('page') || '1', 10);
    const upcomingOnly = params.get('upcomingOnly') !== 'false';

    setFiltersState({ location, date, skillLevels, upcomingOnly });
    setPageState(pageParam);
  }, []);

  const updateURL = useCallback((newFilters: FilterState, newPage: number) => {
    const params = new URLSearchParams();
    
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.date) params.set('date', newFilters.date);
    if (newFilters.skillLevels.length > 0) {
      params.set('skillLevels', newFilters.skillLevels.join(','));
    }
    if (!newFilters.upcomingOnly) params.set('upcomingOnly', 'false');
    if (newPage > 1) params.set('page', String(newPage));

    const newURL = params.toString() 
      ? `${window.location.pathname}?${params.toString()}` 
      : window.location.pathname;
    
    window.history.pushState({}, '', newURL);
  }, []);

  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
    setPageState(1);
    updateURL(newFilters, 1);
  }, [updateURL]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
    updateURL(filters, newPage);
  }, [filters, updateURL]);

  const clearFilters = useCallback(() => {
    const emptyFilters: FilterState = {
      location: '',
      date: '',
      skillLevels: [],
      upcomingOnly: true,
    };
    setFiltersState(emptyFilters);
    setPageState(1);
    updateURL(emptyFilters, 1);
  }, [updateURL]);

  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.date) params.set('date', filters.date);
    if (filters.skillLevels.length > 0) {
      params.set('skillLevels', filters.skillLevels.join(','));
    }
    if (!filters.upcomingOnly) params.set('upcomingOnly', 'false');
    return params;
  }, [filters]);

  const value = useMemo(() => ({
    filters,
    page,
    setFilters,
    setPage,
    clearFilters,
    getQueryParams,
  }), [filters, page, setFilters, setPage, clearFilters, getQueryParams]);

  return value;
}
