import { PickleballTournamentsScraper } from './pickleballtournaments.js';
import { MaincourtScraper } from './maincourt.js';
class ScraperRegistryImpl {
    scrapers = new Map();
    constructor() {
        this.registerDefaultScrapers();
    }
    registerDefaultScrapers() {
        const scrapers = [
            new PickleballTournamentsScraper(),
            new MaincourtScraper(),
        ];
        for (const scraper of scrapers) {
            this.scrapers.set(scraper.sourceName, scraper);
        }
    }
    register(scraper) {
        this.scrapers.set(scraper.sourceName, scraper);
    }
    getScraper(name) {
        return this.scrapers.get(name);
    }
    getAllScrapers() {
        return Array.from(this.scrapers.values());
    }
    getSourceNames() {
        return Array.from(this.scrapers.keys());
    }
}
const registry = new ScraperRegistryImpl();
export { registry, ScraperRegistryImpl };
//# sourceMappingURL=registry.js.map