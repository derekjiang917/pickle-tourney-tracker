import * as cheerio from 'cheerio';
import { parseDate, parseSkillLevels, extractCityState, sanitizeString, createTournament, } from './utils.js';
import { fetchHtmlWithRetry } from './puppeteer.js';
const SOURCE_NAME = 'pickleballtournaments.com';
const BASE_URL = 'https://pickleballtournaments.com';
export const SOURCE_NAME_PICKLEBALLTOURNAMENTS = SOURCE_NAME;
export const BASE_URL_PICKLEBALLTOURNAMENTS = BASE_URL;
export async function scrapePickleballTournaments() {
    const tournaments = [];
    try {
        const baseUrl = 'https://pickleballtournaments.com/search?tournament_filter=now_registering&show_all=true&zoom_level=7';
        const maxPages = 5;
        for (let page = 1; page <= maxPages; page++) {
            const url = `${baseUrl}&current_page=${page}`;
            console.log(`Scraping page ${page}: ${url}`);
            const $ = await fetchPickleballTournamentsListPage(url);
            const tournamentCards = $('[class*="cursor-pointer"][href*="/tournaments/"]');
            console.log(`Found ${tournamentCards.length} tournament card elements on page ${page}`);
            if (tournamentCards.length > 0) {
                const seenUrls = new Set();
                tournamentCards.each((_, element) => {
                    const href = $(element).attr('href');
                    if (href && href.includes('/tournaments/') && href !== '/tournaments') {
                        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                        if (!seenUrls.has(fullUrl)) {
                            seenUrls.add(fullUrl);
                        }
                    }
                });
                console.log(`Found ${seenUrls.size} unique tournament URLs`);
                for (const url of Array.from(seenUrls)) {
                    try {
                        const tournament = await scrapePickleballTournamentPage(url);
                        if (tournament) {
                            tournaments.push(tournament);
                        }
                    }
                    catch (error) {
                        console.error(`Error scraping tournament ${url}:`, error);
                    }
                }
            }
            const jsonData = extractPickleballTournamentsJsonData($);
            console.log('JSON data found:', Object.keys(jsonData));
            if (jsonData.tournaments && Array.isArray(jsonData.tournaments)) {
                console.log(`Found ${jsonData.tournaments.length} tournaments in JSON`);
                for (const t of jsonData.tournaments) {
                    const tournament = parsePickleballTournamentJson(t);
                    if (tournament) {
                        tournaments.push(tournament);
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('Error in pickleballtournaments scraper:', error);
    }
    return tournaments;
}
async function fetchPickleballTournamentsListPage(url) {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const browser = await import('puppeteer').then((p) => p.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }));
            try {
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                await page.goto(url, { waitUntil: 'load', timeout: 60000 });
                try {
                    await page.waitForSelector('[class*="tournament"], a[href*="/tournaments/"], [data-testid*="tournament"]', { timeout: 15000 });
                }
                catch {
                    console.log('Tournament elements not found, continuing with whatever loaded');
                }
                const html = await page.content();
                return cheerio.load(html);
            }
            finally {
                await browser.close();
            }
        }
        catch (error) {
            lastError = error;
            if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
            }
        }
    }
    throw lastError || new Error('Failed to fetch page after retries');
}
export async function scrapePickleballTournamentPage(url) {
    try {
        const $ = await fetchHtmlWithRetry(url);
        const name = sanitizeString($('h1').first().text()) ||
            sanitizeString($('[class*="text-3xl"]').text()) ||
            sanitizeString($('title').text().split('|')[0]);
        if (!name) {
            return null;
        }
        let location = '';
        let city = '';
        let state = '';
        const locationSelectors = [
            '[class*="venue"] a',
            '[class*="location"]',
            '[class*="Where"]',
            'span:contains("Where")',
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
        const dateSelectors = ['[class*="date"]', 'span:contains("202")', '[class*="When"]'];
        for (const selector of dateSelectors) {
            const dateText = $(selector).first().text().trim();
            const dates = extractPickleballTournamentsDates(dateText);
            if (dates.startDate) {
                startDate = dates.startDate;
                endDate = dates.endDate || dates.startDate;
                break;
            }
        }
        const dateFromPage = $('text')
            .filter((_, el) => {
            const text = $(el).text();
            return (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text) ||
                /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i.test(text));
        })
            .first()
            .text();
        if (dateFromPage) {
            const dates = extractPickleballTournamentsDates(dateFromPage);
            if (dates.startDate) {
                startDate = dates.startDate;
                endDate = dates.endDate || dates.startDate;
            }
        }
        let registrationUrl;
        const registerBtn = $('a:contains("Register"), [class*="Register"] a, button:contains("Register")');
        if (registerBtn.length > 0) {
            const href = registerBtn.attr('href');
            if (href) {
                registrationUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
            }
        }
        const skillLevels = [];
        const pageText = $('body').text();
        const extractedSkills = parseSkillLevels(pageText);
        skillLevels.push(...extractedSkills);
        const description = sanitizeString($('[class*="description"], [class*="About"]').first().text()) ||
            sanitizeString($('meta[name="description"]').attr('content'));
        return createTournament(SOURCE_NAME, {
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
export function extractPickleballTournamentsDates(text) {
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
export function extractPickleballTournamentsJsonData($) {
    const scripts = $('script');
    let jsonData = {};
    scripts.each((_, element) => {
        const content = $(element).html() || '';
        const match = content.match(/window\.__NEXT_DATA__\s*=\s*(\{.*?\})/);
        if (match) {
            try {
                const data = JSON.parse(match[1]);
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
    });
    return jsonData;
}
export function parsePickleballTournamentJson(t) {
    if (!t || typeof t !== 'object')
        return null;
    const tournament = t;
    const name = sanitizeString(tournament.name || tournament.title);
    const sourceUrl = sanitizeString(tournament.url || tournament.link);
    if (!name || !sourceUrl)
        return null;
    const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`;
    let location = '';
    let city = '';
    let state = '';
    const venue = tournament.venue || '';
    const cityStr = tournament.city || '';
    const stateStr = tournament.state || '';
    location = [venue, cityStr, stateStr].filter(Boolean).join(', ');
    const cs = extractCityState(location);
    city = cs.city || cityStr;
    state = cs.state || stateStr;
    let startDate = new Date();
    let endDate = new Date();
    const startDateVal = tournament.startDate || tournament.start_date;
    const endDateVal = tournament.endDate || tournament.end_date;
    if (startDateVal) {
        startDate = parseDate(startDateVal) || new Date();
        endDate = endDateVal ? (parseDate(endDateVal) || startDate) : startDate;
    }
    const skillLevels = parseSkillLevels(JSON.stringify(tournament));
    const description = sanitizeString(tournament.description);
    let registrationUrl;
    const regUrl = tournament.registrationUrl ||
        tournament.registration_url;
    if (regUrl) {
        registrationUrl = regUrl.startsWith('http') ? regUrl : `${BASE_URL}${regUrl}`;
    }
    return createTournament(SOURCE_NAME, {
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
export const pickleballTournamentsScraper = {
    sourceName: SOURCE_NAME,
    baseUrl: BASE_URL,
    scrape: scrapePickleballTournaments,
};
export default scrapePickleballTournaments;
//# sourceMappingURL=pickleballtournaments.js.map