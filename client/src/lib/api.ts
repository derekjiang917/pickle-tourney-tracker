import { Tournament } from '@/types/tournament';

const API_BASE_URL = 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface TournamentFilters {
  location?: string;
  date?: string;
  skillLevels?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FetchTournamentsParams {
  page?: number;
  limit?: number;
  filters?: TournamentFilters;
}

interface ApiSkillLevel {
  id: string;
  skillLevel: string;
  tournamentId: string;
}

interface ApiTournament {
  id: string;
  name: string;
  sourceUrl: string;
  source: string;
  location: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  skillLevels: ApiSkillLevel[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

function parseApiTournament(apiTournament: ApiTournament): Tournament {
  return {
    ...apiTournament,
    skillLevels: apiTournament.skillLevels.map((s) => s.skillLevel),
  };
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

export async function fetchTournaments(
  params: FetchTournamentsParams = {}
): Promise<PaginatedResponse<Tournament>> {
  const { page = 1, limit = 10, filters = {} } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  if (filters.location) {
    searchParams.set('location', filters.location);
  }
  if (filters.date) {
    searchParams.set('date', filters.date);
  }
  if (filters.skillLevels && filters.skillLevels.length > 0) {
    filters.skillLevels.forEach((level) => {
      searchParams.append('skillLevels', level);
    });
  }

  const url = `${API_BASE_URL}/api/tournaments?${searchParams.toString()}`;
  const result = await fetchWithRetry<PaginatedResponse<ApiTournament>>(url);

  return {
    ...result,
    data: result.data.map(parseApiTournament),
  };
}

export async function fetchTournamentById(
  id: string
): Promise<Tournament> {
  const url = `${API_BASE_URL}/api/tournaments/${id}`;
  const apiTournament = await fetchWithRetry<ApiTournament>(url);

  return parseApiTournament(apiTournament);
}
