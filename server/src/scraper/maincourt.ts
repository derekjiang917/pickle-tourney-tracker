import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedTournament, parseDate, parseSkillLevels, extractCityState, sanitizeString, toPacificTime } from './base.js';

// All maincourt.com tournaments are in California (Pacific Time)
export class MaincourtScraper extends BaseScraper {
  readonly sourceName = 'maincourt.com';
  readonly baseUrl = 'https://maincourt.com';

  async scrape(): Promise<ScrapedTournament[]> {
    const tournaments: ScrapedTournament[] = [];

    try {
      const $ = await this.fetchHtmlWithRetry(`${this.baseUrl}/events-list/tournaments/`);

      const tournamentCards = $('.tournamentslisting__card');
      console.log(`Found ${tournamentCards.length} tournament card elements`);

      if (tournamentCards.length > 0) {
        const seenUrls = new Set<string>();

        tournamentCards.each((_, element) => {
          const card = $(element);
          const link = card.find('.tournamentslisting__card__top__link, .tournamentslisting__card__content__link').first();
          const href = link.attr('href');
          if (href && href.includes('/events-list/')) {
            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            if (!seenUrls.has(fullUrl)) {
              seenUrls.add(fullUrl);
            }
          }
        });

        console.log(`Found ${seenUrls.size} unique tournament URLs`);

        for (const url of Array.from(seenUrls)) {
          try {
            const tournament = await this.scrapeTournamentPage(url);
            if (tournament) {
              tournaments.push(tournament);
            }
          } catch (error) {
            console.error(`Error scraping tournament ${url}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error in maincourt scraper:', error);
    }

    return tournaments;
  }

  private async fetchHtmlWithRetry(url: string, maxRetries: number = 3): Promise<cheerio.Root> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const browser = await this.launchBrowser();
        try {
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('JSON.parse')) {
              return;
            }
          });
          
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
          
          try {
            await page.waitForSelector('.tournamentslisting__card, [class*="tournament"]', { timeout: 15000 });
          } catch {
            console.log('Tournament elements not found, continuing with whatever loaded');
          }
          
          const html = await page.content();
          return cheerio.load(html);
        } finally {
          await browser.close();
        }
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        }
      }
    }

    throw lastError || new Error('Failed to fetch page after retries');
  }

  private async scrapeTournamentPage(url: string): Promise<ScrapedTournament | null> {
    try {
      const $ = await this.fetchHtmlWithRetry(url);
      
      const nameRaw = $('.division__title').first().text();
      const name = sanitizeString(nameRaw.replace(/· Tournament Details$/, '').replace(/🏆/, '').trim());
       
      if (!name) {
        return null;
      }

      let location = '';
      let city = '';
      let state = '';
      
      const locationItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-map-pin').length > 0;
      });
      
      if (locationItem.length > 0) {
        const venueLink = locationItem.find('.division__card__list__item__link');
        location = venueLink.length > 0 ? sanitizeString(venueLink.text()) : sanitizeString(locationItem.text());
        const { city: c, state: s } = extractCityState(location);
        city = c;
        state = s;
      }

      let startDate = new Date();
      let endDate = new Date();
      
      const dateItem = $('.division__card__list__item').filter((_, el) => {
        return $(el).find('.icon-new-calendar').length > 0;
      });
      
      if (dateItem.length > 0) {
        const dateText = dateItem.text().trim();
        const dates = this.extractDates(dateText);
        if (dates.startDate) {
          startDate = toPacificTime(dates.startDate);
          endDate = toPacificTime(dates.endDate || dates.startDate);
        }
      }

      let registrationUrl: string | undefined;
      const registerLinks = $('a[href*="register"], a:contains("Register")');
      if (registerLinks.length > 0) {
        const href = registerLinks.first().attr('href');
        if (href) {
          registrationUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        }
      }

      const skillLevels: string[] = [];
      
      const divisionTitles = $('.divi__list');
      divisionTitles.each((_, el) => {
        const titleElement = $(el).find('.divi__list__title');
        const titleText = titleElement.text().trim();
        const extractedFromTitle = this.extractSkillLevelFromTitle(titleText);
        skillLevels.push(...extractedFromTitle);
      });

      if (skillLevels.length === 0) {
        const skillText = $('.divi__row__left__list .icon-ball').parent().text();
        const extractedSkills = parseSkillLevels(skillText);
        skillLevels.push(...extractedSkills);
      }

      const description = sanitizeString($('.division__notes__inner').first().text());

      return this.createTournament({
        name,
        sourceUrl: url,
        location,
        city,
        state,
        startDate,
        endDate,
        skillLevels: [...new Set(skillLevels)],
        description,
        registrationUrl,
      });

    } catch (error) {
      console.error(`Error scraping tournament page ${url}:`, error);
      return null;
    }
  }

  private extractDates(text: string): { startDate: Date | null; endDate: Date | null } {
    const result = { startDate: null as Date | null, endDate: null as Date | null };
    
    const rangePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const rangeMatch = text.match(rangePattern);
    
    if (rangeMatch) {
      result.startDate = parseDate(rangeMatch[1]);
      result.endDate = parseDate(rangeMatch[2]);
      return result;
    }

    const singlePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const singleMatch = text.match(singlePattern);
    
    if (singleMatch) {
      result.startDate = parseDate(singleMatch[1]);
      result.endDate = result.startDate;
    }

    const monthRangePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
    const monthRangeMatch = text.match(monthRangePattern);
    
    if (monthRangeMatch) {
      const startStr = `${monthRangeMatch[1]} ${monthRangeMatch[2]}, ${monthRangeMatch[3]}`;
      const endStr = `${monthRangeMatch[4]} ${monthRangeMatch[5]}, ${monthRangeMatch[6]}`;
      result.startDate = parseDate(startStr);
      result.endDate = parseDate(endStr);
      return result;
    }

    const dayOfWeekMonthRangePattern = /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})\s*[-–]\s*(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
    const dayOfWeekMonthRangeMatch = text.match(dayOfWeekMonthRangePattern);
    
    if (dayOfWeekMonthRangeMatch) {
      const startStr = `${dayOfWeekMonthRangeMatch[1]} ${dayOfWeekMonthRangeMatch[2]}, ${dayOfWeekMonthRangeMatch[3]}`;
      const endStr = `${dayOfWeekMonthRangeMatch[4]} ${dayOfWeekMonthRangeMatch[5]}, ${dayOfWeekMonthRangeMatch[6]}`;
      result.startDate = parseDate(startStr);
      result.endDate = parseDate(endStr);
      return result;
    }

    const dayOfWeekMonthSinglePattern = /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s*(\d{4})/i;
    const dayOfWeekMonthSingleMatch = text.match(dayOfWeekMonthSinglePattern);
    
    if (dayOfWeekMonthSingleMatch) {
      const startStr = `${dayOfWeekMonthSingleMatch[1]} ${dayOfWeekMonthSingleMatch[2]}, ${dayOfWeekMonthSingleMatch[3]}`;
      result.startDate = parseDate(startStr);
      result.endDate = result.startDate;
    }

    return result;
  }

  private extractSkillLevelFromTitle(title: string): string[] {
    const levels: string[] = [];
    const allLevels = ['3.0', '3.5', '4.0', '4.5', '5.0', '5.0+'];
    
    const match = title.match(/^([\d.]+)\+?\s/);
    if (match) {
      const baseLevel = match[1];
      
      if (title.includes('+')) {
        const baseIndex = allLevels.indexOf(baseLevel);
        if (baseIndex !== -1) {
          levels.push(...allLevels.slice(baseIndex));
        } else {
          levels.push(baseLevel);
          levels.push('5.0+');
        }
      } else {
        levels.push(baseLevel);
      }
    }
    
    return levels;
  }

  private extractJsonData($: cheerio.Root): { tournaments?: unknown[] } {
    const scripts = $('script');
    let jsonData: { tournaments?: unknown[] } = {};

    scripts.each((_, element) => {
      const content = $(element).html() || '';
      
      const nextDataMatch = content.match(/window\.__NEXT_DATA__\s*=\s*(\{.*?\})/);
      if (nextDataMatch) {
        try {
          const data = JSON.parse(nextDataMatch[1]);
          if (data.props?.pageProps) {
            const pageProps = data.props.pageProps;
            if (pageProps.tournaments) {
              jsonData.tournaments = pageProps.tournaments;
            } else if (pageProps.initialData?.tournaments) {
              jsonData.tournaments = pageProps.initialData.tournaments;
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      const ssrDataMatch = content.match(/window\.__SSR_DATA__\s*=\s*(\{.*?\})/);
      if (ssrDataMatch) {
        try {
          const data = JSON.parse(ssrDataMatch[1]);
          if (data.tournaments) {
            jsonData.tournaments = data.tournaments;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    return jsonData;
  }

  private parseJsonTournament(t: unknown): ScrapedTournament | null {
    if (!t || typeof t !== 'object') return null;
    
    const tournament = t as Record<string, unknown>;
    const name = sanitizeString(tournament.name as string || tournament.title as string);
    const sourceUrl = sanitizeString(tournament.url as string || tournament.link as string || tournament.slug as string);
    
    if (!name || !sourceUrl) return null;

    const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${this.baseUrl}${sourceUrl}`;
    
    let location = '';
    let city = '';
    let state = '';
    
    const venue = tournament.venue as string || tournament.location as string || '';
    const cityStr = tournament.city as string || '';
    const stateStr = tournament.state as string || '';
    
    location = [venue, cityStr, stateStr].filter(Boolean).join(', ');
    const cs = extractCityState(location);
    city = cs.city || cityStr;
    state = cs.state || stateStr;

    let startDate = new Date();
    let endDate = new Date();
    
    const startDateVal = tournament.startDate as string || tournament.start_date as string || tournament.date as string;
    const endDateVal = tournament.endDate as string || tournament.end_date as string;
    
    if (startDateVal) {
      startDate = parseDate(startDateVal) || new Date();
      endDate = endDateVal ? (parseDate(endDateVal) || startDate) : startDate;
    }

    const skillLevels = parseSkillLevels(JSON.stringify(tournament));

    const description = sanitizeString(tournament.description as string || tournament.details as string);

    let registrationUrl: string | undefined;
    const regUrl = tournament.registrationUrl as string || tournament.registration_url as string || tournament.registerUrl as string;
    if (regUrl) {
      registrationUrl = regUrl.startsWith('http') ? regUrl : `${this.baseUrl}${regUrl}`;
    }

    return this.createTournament({
      name,
      sourceUrl: fullUrl,
      location,
      city,
      state,
      startDate,
      endDate,
      skillLevels,
      description,
      registrationUrl,
    });
  }
}

export default MaincourtScraper;
