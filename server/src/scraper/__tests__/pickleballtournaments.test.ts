import { describe, it, expect, vi } from 'vitest';
import * as cheerio from 'cheerio';
import { parsePBTListDate, extractPBTEventSkillLevel } from '../pickleballtournaments.js';
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

describe('extractPBTEventSkillLevel', () => {
  const ALL_PBT_LEVELS = ['3.0', '3.5', '4.0', '4.5', '5.0', '5.5'];

  it('returns all skill levels for OPEN title', () => {
    const result = extractPBTEventSkillLevel('Mens Doubles OPEN Cash Prize: (Any) Age: (Any)');
    expect(result).toEqual(expect.arrayContaining(ALL_PBT_LEVELS));
    expect(result).not.toContain('6.0');
    expect(result.length).toBe(ALL_PBT_LEVELS.length);
  });

  it('returns single skill level for specific skill', () => {
    const result = extractPBTEventSkillLevel('Mens Doubles Skill: (3.0) Age: (50 And Above)');
    expect(result).toEqual(['3.0']);
  });

  it('returns expanded levels for 4.5 And Above', () => {
    const result = extractPBTEventSkillLevel('Womens Doubles Skill: (4.5 And Above) Age: (50 And Above)');
    expect(result).toEqual(['4.5', '5.0', '5.5']);
  });

  it('returns expanded levels for 5.0 And Above', () => {
    const result = extractPBTEventSkillLevel('Mixed Doubles Skill: (5.0 And Above) Age: (Any)');
    expect(result).toEqual(['5.0', '5.5']);
  });

  it('returns single level for 2.5', () => {
    const result = extractPBTEventSkillLevel('Womens Doubles Skill: (2.5) Age: (Any)');
    expect(result).toEqual(['2.5']);
  });

  it('returns all skill levels when Skill is (Any)', () => {
    const result = extractPBTEventSkillLevel('Mens Singles Skill: (Any) Age: (Any)');
    expect(result).toEqual(expect.arrayContaining(ALL_PBT_LEVELS));
    expect(result).not.toContain('6.0');
    expect(result.length).toBe(ALL_PBT_LEVELS.length);
  });

  it('does not match Age And Above as a skill level', () => {
    // "Age: (50 And Above)" should not affect skill level extraction
    const result = extractPBTEventSkillLevel('Mens Doubles Skill: (3.5) Age: (50 And Above)');
    expect(result).toEqual(['3.5']);
  });

  it('returns empty array when no skill info found', () => {
    const result = extractPBTEventSkillLevel('Some random event title');
    expect(result).toEqual([]);
  });
});

describe('detail page HTML extraction', () => {
  const DETAIL_HTML = `
    <html><body>
      <h1 class="hidden max-w-[650px] text-2xl font-semibold text-gray-900 lg:flex">
        The San Diego Gold Cup @ Coronado Island Marriott Resort
      </h1>

      <div class="relative flex flex-col gap-4 rounded-lg bg-white p-4">
        <h1 class="text-lg font-bold text-blue-600 sm:text-2xl">Tournament Description</h1>
        <div id="details-content" class="whitespace-pre-line h-48 overflow-hidden text-gray-900">
          <div class="mb-4 text-sm sm:text-base">Welcome to the San Diego Gold Cup!</div>
          <div class="mb-4 text-sm sm:text-base">This is a premier pickleball tournament.</div>
        </div>
      </div>

      <div class="relative flex flex-col gap-4 rounded-lg bg-white p-4">
        <h1 class="text-lg font-bold text-blue-600 sm:text-2xl">Refund Policy</h1>
        <div id="details-content" class="whitespace-pre-line h-48 overflow-hidden text-gray-900">
          <div class="mb-4 text-sm sm:text-base">Full refund within 7 days of registration.</div>
        </div>
      </div>

      <div class="relative flex flex-col gap-4 rounded-lg bg-white p-4">
        <h1 class="text-lg font-bold text-blue-600 sm:text-2xl">Venue Details</h1>
        <div class="font-bold">Coronado Island Marriott Resort</div>
        <div>2000 2nd St</div>
        <div class="font-medium text-gray-900">Coronado, CA, 92118</div>
        <a target="_blank" href="https://www.google.com/maps?q=Coronado Island Marriott Resort, 2000 2nd St, Coronado, CA, 92118">
          <div class="font-medium text-gray-600 underline">Get Directions</div>
        </a>
      </div>

      <a aria-label="Link to Register for the Tournament" class="contents"
         href="https://pickleballbrackets.com/redirect_r.aspx?mf=t&mid=12345&todo=r&rurl=abc">
        Register Now
      </a>

      <img class="!max-h-40 object-contain" src="https://cdn.pickleballbrackets.com/uploads/TestLogo.jpg?v=1">
    </body></html>
  `;

  it('extracts description as markdown with section headers', () => {
    const $ = cheerio.load(DETAIL_HTML);

    const descriptionSections = [
      'Tournament Description',
      'Additional Information',
      'Refund Policy',
      'Prize Money',
    ];
    const sections: string[] = [];

    $('h1.text-blue-600').each((_, el) => {
      const sectionTitle = $(el).text().trim();
      if (!descriptionSections.includes(sectionTitle)) return;

      const contentDiv = $(el).siblings('div#details-content, div.whitespace-pre-line').first();
      const paragraphs: string[] = [];
      contentDiv.find('div.mb-4').each((_, p) => {
        const text = sanitizeString($(p).text());
        if (text) paragraphs.push(text);
      });

      const content = paragraphs.join('\n\n');
      if (content) {
        sections.push(`## ${sectionTitle}\n${content}`);
      }
    });

    const description = sections.join('\n\n');
    expect(description).toContain('## Tournament Description');
    expect(description).toContain('Welcome to the San Diego Gold Cup!');
    expect(description).toContain('This is a premier pickleball tournament.');
    expect(description).toContain('## Refund Policy');
    expect(description).toContain('Full refund within 7 days of registration.');
    // Venue Details section should be excluded
    expect(description).not.toContain('## Venue Details');
  });

  it('extracts location from Google Maps link', () => {
    const $ = cheerio.load(DETAIL_HTML);

    const mapsLink = $('a[href*="google.com/maps"]').first();
    expect(mapsLink.length).toBe(1);

    const href = mapsLink.attr('href') || '';
    const urlObj = new URL(href);
    const q = urlObj.searchParams.get('q');
    expect(q).toBe('Coronado Island Marriott Resort, 2000 2nd St, Coronado, CA, 92118');

    const { city, state } = extractCityState(q!);
    expect(city).toBe('Coronado');
    expect(state).toBe('CA');
  });

  it('extracts registration URL correctly', () => {
    const $ = cheerio.load(DETAIL_HTML);

    const registerLink = $('a[aria-label="Link to Register for the Tournament"]').first();
    expect(registerLink.length).toBe(1);

    const href = registerLink.attr('href');
    expect(href).toBe('https://pickleballbrackets.com/redirect_r.aspx?mf=t&mid=12345&todo=r&rurl=abc');
  });

  it('extracts image URL from object-contain img', () => {
    const $ = cheerio.load(DETAIL_HTML);
    const imageUrl = $('img.object-contain').first().attr('src');
    expect(imageUrl).toBe('https://cdn.pickleballbrackets.com/uploads/TestLogo.jpg?v=1');
  });
});
