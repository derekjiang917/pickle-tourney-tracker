import { BaseScraper, parseDate, parseSkillLevels, extractCityState, sanitizeString } from './base.js';
export class MaincourtScraper extends BaseScraper {
    sourceName = 'maincourt.com';
    baseUrl = 'https://www.maincourt.com';
    async scrape() {
        const tournaments = [];
        try {
            const $ = await this.fetchHtmlWithRetry(`${this.baseUrl}/tournaments`);
            const tournamentCards = $('[class*="tournament"], [class*="event"], .tournament-card, .event-card, a[href*="/tournament/"], a[href*="/events/"]');
            if (tournamentCards.length > 0) {
                const seenUrls = new Set();
                tournamentCards.each((_, element) => {
                    const href = $(element).attr('href');
                    if (href && (href.includes('/tournament/') || href.includes('/events/'))) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        if (!seenUrls.has(fullUrl)) {
                            seenUrls.add(fullUrl);
                        }
                    }
                });
                for (const url of Array.from(seenUrls)) {
                    try {
                        const tournament = await this.scrapeTournamentPage(url);
                        if (tournament) {
                            tournaments.push(tournament);
                        }
                    }
                    catch (error) {
                        console.error(`Error scraping tournament ${url}:`, error);
                    }
                }
            }
            const jsonData = this.extractJsonData($);
            if (jsonData.tournaments && Array.isArray(jsonData.tournaments)) {
                for (const t of jsonData.tournaments) {
                    const tournament = this.parseJsonTournament(t);
                    if (tournament) {
                        tournaments.push(tournament);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in maincourt scraper:', error);
        }
        return tournaments;
    }
    async fetchHtmlWithRetry(url, maxRetries = 3) {
        const { default: cheerio } = await import('cheerio');
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const browser = await this.launchBrowser();
                try {
                    const page = await browser.newPage();
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
                    const html = await page.content();
                    return cheerio.load(html);
                }
                finally {
                    await browser.close();
                }
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
            }
        }
        throw lastError || new Error('Failed to fetch page after retries');
    }
    async scrapeTournamentPage(url) {
        try {
            const $ = await this.fetchHtmlWithRetry(url);
            const name = sanitizeString($('h1').first().text()) ||
                sanitizeString($('[class*="title"]').first().text()) ||
                sanitizeString($('[class*="name"]').first().text()) ||
                sanitizeString($('title').text().split('|')[0]);
            if (!name) {
                return null;
            }
            let location = '';
            let city = '';
            let state = '';
            const locationSelectors = [
                '[class*="venue"]',
                '[class*="location"]',
                '[class*="address"]',
                '[class*="Where"]',
                'span:contains("Where")',
                '[data-testid*="location"]',
            ];
            for (const selector of locationSelectors) {
                const locationText = $(selector).first().text().trim();
                if (locationText && locationText.length > 2) {
                    location = locationText;
                    const { city: c, state: s } = extractCityState(location);
                    city = c;
                    state = s;
                    break;
                }
            }
            let startDate = new Date();
            let endDate = new Date();
            const dateSelectors = [
                '[class*="date"]',
                '[class*="time"]',
                '[class*="When"]',
                '[data-testid*="date"]',
                'time',
            ];
            for (const selector of dateSelectors) {
                const dateText = $(selector).first().text().trim();
                const dates = this.extractDates(dateText);
                if (dates.startDate) {
                    startDate = dates.startDate;
                    endDate = dates.endDate || dates.startDate;
                    break;
                }
            }
            const dateFromPage = $('body').text().match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\b.*?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/);
            if (dateFromPage) {
                const dates = this.extractDates(dateFromPage[0]);
                if (dates.startDate) {
                    startDate = dates.startDate;
                    endDate = dates.endDate || dates.startDate;
                }
            }
            let registrationUrl;
            const registerBtn = $('a:contains("Register"), [class*="register"] a, button:contains("Register"), a[href*="register"]');
            if (registerBtn.length > 0) {
                const href = registerBtn.attr('href');
                if (href) {
                    registrationUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                }
            }
            const skillLevels = [];
            const pageText = $('body').text();
            const extractedSkills = parseSkillLevels(pageText);
            skillLevels.push(...extractedSkills);
            const description = sanitizeString($('[class*="description"], [class*="about"], [class*="details"]').first().text()) ||
                sanitizeString($('meta[name="description"]').attr('content'));
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
        }
        catch (error) {
            console.error(`Error scraping tournament page ${url}:`, error);
            return null;
        }
    }
    extractDates(text) {
        const result = { startDate: null, endDate: null };
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
        }
        return result;
    }
    extractJsonData($) {
        const scripts = $('script');
        let jsonData = {};
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
                        }
                        else if (pageProps.initialData?.tournaments) {
                            jsonData.tournaments = pageProps.initialData.tournaments;
                        }
                    }
                }
                catch (e) {
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
                }
                catch (e) {
                    // Ignore parse errors
                }
            }
        });
        return jsonData;
    }
    parseJsonTournament(t) {
        if (!t || typeof t !== 'object')
            return null;
        const tournament = t;
        const name = sanitizeString(tournament.name || tournament.title);
        const sourceUrl = sanitizeString(tournament.url || tournament.link || tournament.slug);
        if (!name || !sourceUrl)
            return null;
        const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${this.baseUrl}${sourceUrl}`;
        let location = '';
        let city = '';
        let state = '';
        const venue = tournament.venue || tournament.location || '';
        const cityStr = tournament.city || '';
        const stateStr = tournament.state || '';
        location = [venue, cityStr, stateStr].filter(Boolean).join(', ');
        const cs = extractCityState(location);
        city = cs.city || cityStr;
        state = cs.state || stateStr;
        let startDate = new Date();
        let endDate = new Date();
        const startDateVal = tournament.startDate || tournament.start_date || tournament.date;
        const endDateVal = tournament.endDate || tournament.end_date;
        if (startDateVal) {
            startDate = parseDate(startDateVal) || new Date();
            endDate = endDateVal ? (parseDate(endDateVal) || startDate) : startDate;
        }
        const skillLevels = parseSkillLevels(JSON.stringify(tournament));
        const description = sanitizeString(tournament.description || tournament.details);
        let registrationUrl;
        const regUrl = tournament.registrationUrl || tournament.registration_url || tournament.registerUrl;
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
//# sourceMappingURL=maincourt.js.map