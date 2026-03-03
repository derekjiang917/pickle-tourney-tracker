import { describe, it, expect, vi } from 'vitest';
import * as cheerio from 'cheerio';
import {
  extractPickleballTournamentsDates,
  extractPickleballTournamentsJsonData,
  parsePickleballTournamentJson,
} from '../pickleballtournaments.js';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        content: vi.fn().mockResolvedValue('<html><body></body></html>'),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('extractPickleballTournamentsDates', () => {
  it('parses date range MM/DD/YYYY - MM/DD/YYYY', () => {
    const result = extractPickleballTournamentsDates('01/15/2024 - 01/20/2024');
    expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-20');
  });

  it('parses single date', () => {
    const result = extractPickleballTournamentsDates('01/15/2024');
    expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('parses month name range', () => {
    const result = extractPickleballTournamentsDates('January 15, 2024 - January 20, 2024');
    expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-20');
  });

  it('handles invalid input', () => {
    const result = extractPickleballTournamentsDates('not a date');
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeNull();
  });
});

describe('extractPickleballTournamentsJsonData', () => {
  it('finds __NEXT_DATA__ script content', () => {
    const html = `
      <html>
        <script>window.__NEXT_DATA__ = {"props":{}}</script>
      </html>
    `;
    const $ = cheerio.load(html);
    const result = extractPickleballTournamentsJsonData($);
    
    expect(result).toBeDefined();
  });

  it('finds __NEXT_DATA__ with initialData', () => {
    const html = `
      <html>
        <script>window.__NEXT_DATA__ = {"props":{"pageProps":{"initialData":{}}}}</script>
      </html>
    `;
    const $ = cheerio.load(html);
    const result = extractPickleballTournamentsJsonData($);
    
    expect(result).toBeDefined();
  });

  it('returns empty object for no data', () => {
    const html = '<html><body>No data</body></html>';
    const $ = cheerio.load(html);
    const result = extractPickleballTournamentsJsonData($);
    
    expect(result.tournaments).toBeUndefined();
  });
});

describe('parsePickleballTournamentJson', () => {
  it('parses valid tournament object', () => {
    const tournament = {
      name: 'Test Tournament',
      url: '/tournaments/test',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Tournament');
    expect(result?.source).toBe('pickleballtournaments.com');
  });

  it('parses tournament with different field names', () => {
    const tournament = {
      title: 'Another Tournament',
      link: '/events/123',
      start_date: '2024-02-01',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Another Tournament');
  });

  it('returns null for invalid tournament', () => {
    expect(parsePickleballTournamentJson(null)).toBeNull();
    expect(parsePickleballTournamentJson('string')).toBeNull();
    expect(parsePickleballTournamentJson({})).toBeNull();
  });

  it('handles missing name gracefully', () => {
    const tournament = {
      url: '/tournaments/test',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    expect(result).toBeNull();
  });

  it('handles missing url gracefully', () => {
    const tournament = {
      name: 'Test',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    expect(result).toBeNull();
  });

  it('constructs full URL correctly', () => {
    const tournament = {
      name: 'Test',
      url: '/tournaments/123',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    
    expect(result?.sourceUrl).toBe('https://pickleballtournaments.com/tournaments/123');
  });

  it('handles URL with http prefix', () => {
    const tournament = {
      name: 'Test',
      url: 'https://other.com/tournaments/123',
    };
    
    const result = parsePickleballTournamentJson(tournament);
    
    expect(result?.sourceUrl).toBe('https://other.com/tournaments/123');
  });
});
