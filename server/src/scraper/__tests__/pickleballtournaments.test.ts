import { describe, it, expect, vi } from 'vitest';
import * as cheerio from 'cheerio';
import { parsePBTListDate } from '../pickleballtournaments.js';
import { extractCityState, sanitizeString } from '../utils.js';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        waitForSelector: vi.fn().mockResolvedValue(undefined),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
        content: vi.fn().mockResolvedValue('<html><body></body></html>'),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('parsePBTListDate', () => {
  it('parses a date range with hyphen', () => {
    const result = parsePBTListDate('Apr 10, 2026 - Apr 12, 2026');
    expect(result.startDate).toBe('2026-04-10');
    expect(result.endDate).toBe('2026-04-12');
  });

  it('parses same-day range', () => {
    const result = parsePBTListDate('Apr 10, 2026 - Apr 10, 2026');
    expect(result.startDate).toBe('2026-04-10');
    expect(result.endDate).toBe('2026-04-10');
  });

  it('parses a date range with en-dash', () => {
    const result = parsePBTListDate('Apr 10, 2026 \u2013 Apr 12, 2026');
    expect(result.startDate).toBe('2026-04-10');
    expect(result.endDate).toBe('2026-04-12');
  });

  it('parses single date (no range)', () => {
    const result = parsePBTListDate('Apr 10, 2026');
    expect(result.startDate).toBe('2026-04-10');
    expect(result.endDate).toBe('2026-04-10');
  });

  it('returns nulls for empty string', () => {
    const result = parsePBTListDate('');
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeNull();
  });

  it('returns nulls for garbage input', () => {
    const result = parsePBTListDate('not a date at all!!!');
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeNull();
  });
});

describe('card extraction from list page HTML', () => {
  const CARD_HTML = `
    <html><body>
      <a class="block" href="https://pickleballtournaments.com/tournaments/test-open-2026">
        <div class="group relative flex cursor-pointer flex-col rounded-xl border bg-white">
          <div class="relative flex items-center">
            <img alt="Test Open 2026" src="https://cdn.example.com/images/test-open.jpg" />
          </div>
          <div class="flex flex-1 flex-col">
            <div class="!line-clamp-2 block text-sm font-medium text-gray-900"
                 title="Test Open 2026">
              Test Open 2026
            </div>
            <div class="line-clamp-1 text-sm text-gray-600">San Clemente, CA, USA</div>
            <div class="text-sm line-clamp-1 text-gray-700">Apr 10, 2026 - Apr 12, 2026</div>
            <div class="mt-2 flex">
              <div class="bg-success-700">
                <p class="text-sm font-semibold">USD $50</p>
              </div>
              <div class="text-xs flex text-gray-600">42 players</div>
            </div>
          </div>
        </div>
      </a>
    </body></html>
  `;

  it('extracts sourceUrl from card href', () => {
    const $ = cheerio.load(CARD_HTML);
    const card = $('a.block[href*="/tournaments/"]').first();
    const href = card.attr('href')!;
    const sourceUrl = href.startsWith('http') ? href : `https://pickleballtournaments.com${href}`;
    expect(sourceUrl).toBe('https://pickleballtournaments.com/tournaments/test-open-2026');
  });

  it('extracts tournament name via title attribute', () => {
    const $ = cheerio.load(CARD_HTML);
    const card = $('a.block[href*="/tournaments/"]').first();
    const nameEl = card.find('div[class*="line-clamp-2"][class*="font-medium"]');
    const name = sanitizeString(nameEl.attr('title') || nameEl.text());
    expect(name).toBe('Test Open 2026');
  });

  it('extracts and parses location', () => {
    const $ = cheerio.load(CARD_HTML);
    const card = $('a.block[href*="/tournaments/"]').first();
    const locationEl = card.find('div.line-clamp-1.text-sm.text-gray-600');
    const locationText = sanitizeString(locationEl.text());
    expect(locationText).toBe('San Clemente, CA, USA');
    const { city, state } = extractCityState(locationText);
    expect(city).toBe('San Clemente');
    expect(state).toBe('CA');
  });

  it('extracts and parses dates', () => {
    const $ = cheerio.load(CARD_HTML);
    const card = $('a.block[href*="/tournaments/"]').first();
    const dateEl = card.find('div.text-sm.line-clamp-1.text-gray-700');
    const dateText = sanitizeString(dateEl.text());
    const { startDate, endDate } = parsePBTListDate(dateText);
    expect(startDate).toBe('2026-04-10');
    expect(endDate).toBe('2026-04-12');
  });

  it('extracts image URL', () => {
    const $ = cheerio.load(CARD_HTML);
    const card = $('a.block[href*="/tournaments/"]').first();
    const imageUrl = card.find('img').first().attr('src');
    expect(imageUrl).toBe('https://cdn.example.com/images/test-open.jpg');
  });
});
