import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as cheerio from 'cheerio';
import {
  extractMaincourtDates,
  extractMaincourtSkillLevel,
  parseMaincourtJsonTournament,
  extractMaincourtJsonData,
} from '../maincourt.js';
import { parsePBTListDate } from '../pickleballtournaments.js';

const MAINCOURT_LIST_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Tournaments</title></head>
<body>
  <div class="tournamentslisting">
    <div class="tournamentslisting__card">
      <a class="tournamentslisting__card__top__link" href="/events-list/test-tournament-1">
        Test Tournament 1
      </a>
    </div>
    <div class="tournamentslisting__card">
      <a class="tournamentslisting__card__content__link" href="/events-list/test-tournament-2">
        Test Tournament 2
      </a>
    </div>
  </div>
</body>
</html>
`;

const MAINCOURT_TOURNAMENT_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Test Tournament</title></head>
<body>
  <div class="division">
    <h1 class="division__title">🏆 Winter Classic 2024 · Tournament Details</h1>
    <div class="division__card">
      <div class="division__card__list">
        <div class="division__card__list__item">
          <span class="icon-new-map-pin"></span>
          <a class="division__card__list__item__link" href="#">Sports Complex, Seattle, WA</a>
        </div>
        <div class="division__card__list__item">
          <span class="icon-new-calendar"></span>
          <span>01/15/2024 - 01/20/2024</span>
        </div>
      </div>
    </div>
    <div class="divi__list">
      <div class="divi__list__title">3.5 Division</div>
    </div>
    <div class="divi__list">
      <div class="divi__list__title">4.0 Division</div>
    </div>
    <div class="division__notes__inner">
      <p>Join us for the annual Winter Classic tournament!</p>
    </div>
    <a href="https://register.example.com/event/123">Register Now</a>
  </div>
</body>
</html>
`;

const PICKLEBALL_TOURNAMENTS_LIST_HTML = `
<!DOCTYPE html>
<html>
<head><title>Pickleball Tournaments</title></head>
<body>
  <div class="tournament-list">
    <div class="tournament-card">
      <a href="/tournament/summer-slam-2024">Summer Slam 2024</a>
      <span class="date">July 20, 2024 - July 21, 2024</span>
    </div>
  </div>
  <script>window.__NEXT_DATA__ = {"props":{"pageProps":{"tournaments":[{"name":"JSON Tournament 1","url":"/tournament/json-1","startDate":"2024-03-01","endDate":"2024-03-02","venue":"Community Center","city":"Portland","state":"OR"}]}}}</script>
</body>
</html>
`;

const PICKLEBALL_TOURNAMENT_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Summer Slam 2024</title></head>
<body>
  <div class="tournament-detail">
    <h1 class="tournament-title">Summer Slam 2024</h1>
    <div class="location">
      <span class="icon-map"></span>
      <span>Beachview Courts, San Diego, CA</span>
    </div>
    <div class="dates">
      <span class="icon-calendar"></span>
      <span>July 20, 2024 - July 21, 2024</span>
    </div>
    <div class="skill-levels">
      <span>3.0</span>
      <span>3.5</span>
      <span>4.0</span>
    </div>
    <div class="description">
      <p>Annual summer tournament at the beach!</p>
    </div>
    <a class="register-link" href="/register/summer-slam">Register</a>
  </div>
</body>
</html>
`;

describe('Maincourt Integration Tests', () => {
  describe('HTML Parsing Flow', () => {
    it('parses tournament cards from list page HTML', () => {
      const $ = cheerio.load(MAINCOURT_LIST_PAGE_HTML);

      const cards = $('.tournamentslisting__card');
      expect(cards.length).toBe(2);

      const links: string[] = [];
      cards.each((_, el) => {
        const link = $(el).find('a').first();
        const href = link.attr('href');
        if (href) links.push(href);
      });

      expect(links).toContain('/events-list/test-tournament-1');
      expect(links).toContain('/events-list/test-tournament-2');
    });

    it('extracts complete tournament data from tournament page HTML', () => {
      const $ = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const nameRaw = $('.division__title').first().text();
      const name = nameRaw.replace(/· Tournament Details$/, '').replace(/🏆/, '').trim();
      expect(name).toBe('Winter Classic 2024');

      const locationItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-map-pin').length > 0;
      });
      expect(locationItem.length).toBe(1);

      const dateItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-calendar').length > 0;
      });
      expect(dateItem.length).toBe(1);

      const divisions = $('.divi__list');
      expect(divisions.length).toBe(2);
    });

    it('extracts location information from tournament page', () => {
      const $ = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const locationItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-map-pin').length > 0;
      });

      const link = locationItem.find('.division__card__list__item__link');
      const locationText = link.length > 0 ? link.text().trim() : locationItem.text().trim();
      expect(locationText).toContain('Seattle');
      expect(locationText).toContain('WA');
    });

    it('extracts description from tournament page', () => {
      const $ = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const description = $('.division__notes__inner').first().text();
      expect(description).toContain('Winter Classic');
    });

    it('handles missing elements gracefully', () => {
      const minimalHtml = `
        <html>
          <body>
            <div class="division">
              <h1 class="division__title">Empty Tournament</h1>
            </div>
          </body>
        </html>
      `;
      const $ = cheerio.load(minimalHtml);

      const name = $('.division__title').first().text();
      expect(name).toBe('Empty Tournament');

      const locationItem = $('.division__card__list__item');
      expect(locationItem.length).toBe(0);
    });
  });

  describe('Date Parsing Integration', () => {
    it('parses various date formats from page content', () => {
      const testCases = [
        { input: '01/15/2024 - 01/20/2024', expectedStart: '2024-01-15', expectedEnd: '2024-01-20' },
        { input: 'January 15, 2024 - January 20, 2024', expectedStart: '2024-01-15', expectedEnd: '2024-01-20' },
        { input: 'Mon, January 15, 2024 - Tue, January 20, 2024', expectedStart: '2024-01-15', expectedEnd: '2024-01-20' },
        { input: '05/01/2024', expectedStart: '2024-05-01', expectedEnd: '2024-05-01' },
      ];

      testCases.forEach(({ input, expectedStart, expectedEnd }) => {
        const result = extractMaincourtDates(input);
        expect(result.startDate).toBe(expectedStart);
        expect(result.endDate).toBe(expectedEnd);
      });
    });

    it('handles date extraction from full page content', () => {
      const $ = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const dateItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-calendar').length > 0;
      });

      const dateText = dateItem.text().trim();
      const dates = extractMaincourtDates(dateText);

      expect(dates.startDate).not.toBeNull();
      expect(dates.endDate).not.toBeNull();
      expect(dates.startDate).toBe('2024-01-15');
      expect(dates.endDate).toBe('2024-01-20');
    });
  });

  describe('Skill Level Extraction Integration', () => {
    it('extracts skill levels from division titles', () => {
      const testCases = [
        { input: '3.0 Division', expected: ['3.0'] },
        { input: '3.5 Division', expected: ['3.5'] },
        { input: '4.0+ Division', expected: ['4.0', '4.5', '5.0', '5.5', '6.0'] },
        { input: 'Open Division', expected: [] },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractMaincourtSkillLevel(input);
        expect(result).toEqual(expected);
      });
    });

    it('extracts skill levels from full page HTML', () => {
      const $ = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const skillLevels: string[] = [];
      const divisionTitles = $('.divi__list');
      divisionTitles.each((_, el) => {
        const titleElement = $(el).find('.divi__list__title');
        const titleText = titleElement.text().trim();
        const extractedFromTitle = extractMaincourtSkillLevel(titleText);
        skillLevels.push(...extractedFromTitle);
      });

      expect(skillLevels).toContain('3.5');
      expect(skillLevels).toContain('4.0');
    });
  });

  describe('JSON Data Extraction Integration', () => {
    it('extracts JSON data from __NEXT_DATA__ script', () => {
      const $ = cheerio.load(PICKLEBALL_TOURNAMENTS_LIST_HTML);
      const result = extractMaincourtJsonData($);

      expect(result).toBeDefined();
    });

    it('parses tournament from JSON data', () => {
      const jsonData = {
        name: 'Test JSON Tournament',
        url: '/tournament/test',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        venue: 'Test Venue',
        city: 'Austin',
        state: 'TX',
        description: 'Test description',
      };

      const result = parseMaincourtJsonTournament(jsonData);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test JSON Tournament');
      expect(result?.source).toBe('maincourt.com');
      expect(result?.city).toBe('Austin');
      expect(result?.state).toBe('TX');
    });

    it('validates complete tournament data structure from JSON', () => {
      const tournamentData = {
        name: 'Complete Tournament',
        url: '/tournament/complete',
        startDate: '2024-08-01',
        endDate: '2024-08-03',
        venue: 'Sports Arena',
        city: 'Miami',
        state: 'FL',
        description: 'A great tournament',
        registrationUrl: 'https://register.example.com',
      };

      const result = parseMaincourtJsonTournament(tournamentData);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Complete Tournament');
      expect(result?.sourceUrl).toBe('https://maincourt.com/tournament/complete');
      expect(result?.city).toBe('Miami');
      expect(result?.state).toBe('FL');
      expect(result?.registrationUrl).toBe('https://register.example.com');
    });
  });
});

describe('PickleballTournaments Integration Tests', () => {
  describe('List Page HTML Parsing', () => {
    it('extracts tournament data from detail page HTML', () => {
      const $ = cheerio.load(PICKLEBALL_TOURNAMENT_PAGE_HTML);

      const title = $('.tournament-title').text();
      expect(title).toBe('Summer Slam 2024');

      const location = $('.location').text();
      expect(location).toContain('San Diego');

      const dates = $('.dates').text();
      expect(dates).toContain('July 20, 2024');

      const skills = $('.skill-levels span').map((_, el) => $(el).text()).get();
      expect(skills).toContain('3.0');
      expect(skills).toContain('3.5');
      expect(skills).toContain('4.0');
    });
  });

  describe('Date Parsing Integration', () => {
    it('parses dates from page content using parsePBTListDate', () => {
      const $ = cheerio.load(PICKLEBALL_TOURNAMENT_PAGE_HTML);

      const datesText = $('.dates').text().trim();
      const dates = parsePBTListDate(datesText);

      expect(dates.startDate).not.toBeNull();
      expect(dates.endDate).not.toBeNull();
    });

    it('parses various date formats with parsePBTListDate', () => {
      const testCases = [
        { input: 'Jul 20, 2024 - Jul 21, 2024', expectedStart: '2024-07-20', expectedEnd: '2024-07-21' },
        { input: 'Apr 10, 2026 - Apr 12, 2026', expectedStart: '2026-04-10', expectedEnd: '2026-04-12' },
      ];

      testCases.forEach(({ input, expectedStart, expectedEnd }) => {
        const result = parsePBTListDate(input);
        expect(result.startDate).toBe(expectedStart);
        expect(result.endDate).toBe(expectedEnd);
      });
    });
  });
});

describe('End-to-End Scraping Flow Simulation', () => {
  describe('Maincourt Full Flow', () => {
    it('simulates complete list page to tournament data flow', () => {
      const $list = cheerio.load(MAINCOURT_LIST_PAGE_HTML);

      const tournamentUrls: string[] = [];
      const cards = $list('.tournamentslisting__card');
      cards.each((_, el) => {
        const link = $list(el).find('a').first();
        const href = link.attr('href');
        if (href && href.includes('/events-list/')) {
          const fullUrl = href.startsWith('http') ? href : `https://maincourt.com${href}`;
          tournamentUrls.push(fullUrl);
        }
      });

      expect(tournamentUrls.length).toBe(2);
      expect(tournamentUrls[0]).toBe('https://maincourt.com/events-list/test-tournament-1');
    });

    it('simulates complete tournament page parsing flow', () => {
      const $tournament = cheerio.load(MAINCOURT_TOURNAMENT_PAGE_HTML);

      const nameRaw = $tournament('.division__title').first().text();
      const name = nameRaw.replace(/· Tournament Details$/, '').replace(/🏆/, '').trim();
      expect(name).toBe('Winter Classic 2024');

      const locationItem = $tournament('.division__card__list__item').filter((_, el) => {
        return $tournament(el).find('.icon-new-map-pin').length > 0;
      });
      const venueLink = locationItem.find('.division__card__list__item__link');
      const location = venueLink.length > 0 ? venueLink.text().trim() : locationItem.text().trim();

      const dateItem = $tournament('.division__card__list__item').filter((_, el) => {
        return $tournament(el).find('.icon-new-calendar').length > 0;
      });
      const dateText = dateItem.text().trim();
      const dates = extractMaincourtDates(dateText);

      const skillLevels: string[] = [];
      const divisions = $tournament('.divi__list');
      divisions.each((_, el) => {
        const titleElement = $tournament(el).find('.divi__list__title');
        const titleText = titleElement.text().trim();
        const extracted = extractMaincourtSkillLevel(titleText);
        skillLevels.push(...extracted);
      });

      const description = $tournament('.division__notes__inner').first().text();

      expect(name).toBe('Winter Classic 2024');
      expect(location).toContain('Seattle');
      expect(dates.startDate).not.toBeNull();
      expect(skillLevels).toContain('3.5');
      expect(skillLevels).toContain('4.0');
      expect(description).toContain('Winter Classic');
    });
  });

  describe('PickleballTournaments Full Flow', () => {
    it('parses list page date ranges correctly', () => {
      const dateStr = 'Mar 01, 2024 - Mar 02, 2024';
      const parsed = parsePBTListDate(dateStr);
      expect(parsed.startDate).toBe('2024-03-01');
      expect(parsed.endDate).toBe('2024-03-02');
    });
  });

  describe('Error Handling Flow', () => {
    it('handles malformed HTML gracefully', () => {
      const malformedHtml = '<html><body><p>Test</p>';
      const $ = cheerio.load(malformedHtml);

      const content = $('.nonexistent').text();
      expect(content).toBe('');
    });

    it('handles empty tournament data gracefully', () => {
      const emptyData = {};
      const result = parseMaincourtJsonTournament(emptyData);
      expect(result).toBeNull();
    });

    it('handles missing required fields in tournament', () => {
      const missingName = { url: '/tournament/test' };
      expect(parseMaincourtJsonTournament(missingName)).toBeNull();

      const missingUrl = { name: 'Test Tournament' };
      expect(parseMaincourtJsonTournament(missingUrl)).toBeNull();
    });
  });
});
