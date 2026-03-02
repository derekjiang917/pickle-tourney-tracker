import { Scraper } from './base.js';
interface ScraperRegistry {
    getScraper(name: string): Scraper | undefined;
    getAllScrapers(): Scraper[];
    getSourceNames(): string[];
}
declare class ScraperRegistryImpl implements ScraperRegistry {
    private scrapers;
    constructor();
    private registerDefaultScrapers;
    register(scraper: Scraper): void;
    getScraper(name: string): Scraper | undefined;
    getAllScrapers(): Scraper[];
    getSourceNames(): string[];
}
declare const registry: ScraperRegistryImpl;
export { registry, ScraperRegistry, ScraperRegistryImpl };
//# sourceMappingURL=registry.d.ts.map