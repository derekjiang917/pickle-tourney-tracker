import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}
async function createPage(browser, url) {
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return page;
}
function parseDate(dateStr) {
    const cleaned = dateStr.trim();
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
}
function parseSkillLevels(skillLevelsText) {
    const levels = [];
    const patterns = [
        /\b(1\.0|2\.0|3\.0|3\.5|4\.0|4\.5|5\.0|5\.5|6\.0)\b/gi,
        /\b(Beginner|Intermediate|Advanced|Expert|Open|Pro)\b/gi,
    ];
    for (const pattern of patterns) {
        const matches = skillLevelsText.match(pattern);
        if (matches) {
            levels.push(...matches.map((m) => m.toUpperCase()));
        }
    }
    return [...new Set(levels)];
}
function extractCityState(locationStr) {
    const parts = locationStr.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
        const state = parts[parts.length - 1].trim();
        const city = parts[parts.length - 2].trim();
        return { city, state };
    }
    return { city: '', state: '' };
}
async function fetchPageContent(url) {
    const browser = await launchBrowser();
    try {
        const page = await createPage(browser, url);
        const content = await page.content();
        return content;
    }
    finally {
        await browser.close();
    }
}
async function fetchPageWithPuppeteer(url, selector) {
    const browser = await launchBrowser();
    try {
        const page = await createPage(browser, url);
        await page.waitForSelector(selector, { timeout: 10000 });
        const html = await page.content();
        return cheerio.load(html);
    }
    finally {
        await browser.close();
    }
}
async function scrapeWithRetry(url, maxRetries = 3, delayMs = 1000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fetchPageContent(url);
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    throw lastError || new Error('Failed to fetch page after retries');
}
class ScraperOrchestrator {
    scrapers = new Map();
    register(scraper) {
        this.scrapers.set(scraper.sourceName, scraper);
    }
    getScraper(name) {
        return this.scrapers.get(name);
    }
    getRegisteredSources() {
        return Array.from(this.scrapers.keys());
    }
    async scrapeAll() {
        const results = [];
        for (const [name, scraper] of this.scrapers) {
            const result = {
                success: false,
                source: name,
                tournaments: [],
                timestamp: new Date(),
            };
            try {
                const tournaments = await scraper.scrape();
                result.success = true;
                result.tournaments = tournaments;
            }
            catch (error) {
                result.error = error instanceof Error ? error.message : 'Unknown error';
            }
            results.push(result);
        }
        return results;
    }
    async scrapeSource(sourceName) {
        const scraper = this.scrapers.get(sourceName);
        const result = {
            success: false,
            source: sourceName,
            tournaments: [],
            timestamp: new Date(),
        };
        if (!scraper) {
            result.error = `No scraper registered for source: ${sourceName}`;
            return result;
        }
        try {
            const tournaments = await scraper.scrape();
            result.success = true;
            result.tournaments = tournaments;
        }
        catch (error) {
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }
        return result;
    }
}
const orchestrator = new ScraperOrchestrator();
export { launchBrowser, createPage, parseDate, parseSkillLevels, extractCityState, fetchPageContent, fetchPageWithPuppeteer, scrapeWithRetry, orchestrator, ScraperOrchestrator, DEFAULT_USER_AGENT, };
//# sourceMappingURL=index.js.map