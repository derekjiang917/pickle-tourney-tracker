import { launchBrowser, createPage, fetchHtml, fetchPageContent, scrapeWithRetry, } from './puppeteer.js';
import { parseDate, parseSkillLevels, extractCityState, sanitizeString, extractDomain, toPacificTime, DEFAULT_USER_AGENT, createTournament, } from './utils.js';
import { registry } from './registry.js';
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
export { launchBrowser, createPage, fetchHtml, fetchPageContent, scrapeWithRetry, parseDate, parseSkillLevels, extractCityState, sanitizeString, extractDomain, toPacificTime, createTournament, orchestrator, ScraperOrchestrator, DEFAULT_USER_AGENT, registry, };
//# sourceMappingURL=index.js.map