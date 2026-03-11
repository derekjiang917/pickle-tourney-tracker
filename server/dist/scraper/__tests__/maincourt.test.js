import { describe, it, expect, vi } from 'vitest';
import * as cheerio from 'cheerio';
import { extractMaincourtDates, extractMaincourtSkillLevel, extractMaincourtJsonData, parseMaincourtJsonTournament, } from '../maincourt.js';
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
describe('extractMaincourtDates', () => {
    it('parses date range MM/DD/YYYY - MM/DD/YYYY', () => {
        const result = extractMaincourtDates('01/15/2024 - 01/20/2024');
        expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
        expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-20');
    });
    it('parses single date', () => {
        const result = extractMaincourtDates('01/15/2024');
        expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
        expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-15');
    });
    it('parses month name range', () => {
        const result = extractMaincourtDates('January 15, 2024 - January 20, 2024');
        expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
        expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-20');
    });
    it('parses day of week month range', () => {
        const result = extractMaincourtDates('Mon, January 15, 2024 - Tue, January 20, 2024');
        expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-15');
        expect(result.endDate?.toISOString().split('T')[0]).toBe('2024-01-20');
    });
    it('handles invalid input', () => {
        const result = extractMaincourtDates('not a date');
        expect(result.startDate).toBeNull();
        expect(result.endDate).toBeNull();
    });
});
describe('extractMaincourtSkillLevel', () => {
    it('extracts single level', () => {
        const result = extractMaincourtSkillLevel('3.0 Division');
        expect(result).toContain('3.0');
    });
    it('extracts level with plus', () => {
        const result = extractMaincourtSkillLevel('4.0+ Division');
        expect(result).toContain('4.0');
        expect(result).toContain('4.5');
        expect(result).toContain('5.0');
        expect(result).toContain('5.0+');
    });
    it('returns empty array for no match', () => {
        const result = extractMaincourtSkillLevel('Open Division');
        expect(result).toEqual([]);
    });
});
describe('extractMaincourtJsonData', () => {
    it('finds __NEXT_DATA__ script content', () => {
        const html = `
      <html>
        <script>window.__NEXT_DATA__ = {"props":{}}</script>
      </html>
    `;
        const $ = cheerio.load(html);
        const result = extractMaincourtJsonData($);
        expect(result).toBeDefined();
    });
    it('finds __SSR_DATA__ script content', () => {
        const html = `
      <html>
        <script>window.__SSR_DATA__ = {"tournaments":[]}</script>
      </html>
    `;
        const $ = cheerio.load(html);
        const result = extractMaincourtJsonData($);
        expect(result).toBeDefined();
    });
    it('returns empty object for no data', () => {
        const html = '<html><body>No data</body></html>';
        const $ = cheerio.load(html);
        const result = extractMaincourtJsonData($);
        expect(result.tournaments).toBeUndefined();
    });
});
describe('parseMaincourtJsonTournament', () => {
    it('parses valid tournament object', () => {
        const tournament = {
            name: 'Test Tournament',
            url: '/tournaments/test',
            startDate: '2024-01-15',
            endDate: '2024-01-20',
        };
        const result = parseMaincourtJsonTournament(tournament);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('Test Tournament');
        expect(result?.source).toBe('maincourt.com');
    });
    it('parses tournament with different field names', () => {
        const tournament = {
            title: 'Another Tournament',
            link: '/events/123',
            date: '2024-02-01',
        };
        const result = parseMaincourtJsonTournament(tournament);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('Another Tournament');
    });
    it('returns null for invalid tournament', () => {
        expect(parseMaincourtJsonTournament(null)).toBeNull();
        expect(parseMaincourtJsonTournament('string')).toBeNull();
        expect(parseMaincourtJsonTournament({})).toBeNull();
    });
    it('handles missing name gracefully', () => {
        const tournament = {
            url: '/tournaments/test',
        };
        const result = parseMaincourtJsonTournament(tournament);
        expect(result).toBeNull();
    });
    it('handles missing url gracefully', () => {
        const tournament = {
            name: 'Test',
        };
        const result = parseMaincourtJsonTournament(tournament);
        expect(result).toBeNull();
    });
});
//# sourceMappingURL=maincourt.test.js.map