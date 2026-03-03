import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { registry } from '../scraper/registry.js';
import { upsertTournaments } from '../services/tournamentService.js';
const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
let scheduledTask = null;
let isRunning = false;
export async function runScrapeJob(options = {}) {
    const { source } = options;
    const startTime = Date.now();
    const result = {
        success: false,
        tournamentsFound: 0,
        tournamentsCreated: 0,
        tournamentsUpdated: 0,
        errors: [],
        duration: 0,
    };
    if (isRunning) {
        result.errors.push('Scrape job is already running');
        return result;
    }
    isRunning = true;
    const scrapeLog = await prisma.scrapeLog.create({
        data: {
            source: source || 'all',
            startTime: new Date(),
            status: 'running',
        },
    });
    try {
        const sources = source ? [source] : registry.getSourceNames();
        console.log(`Scraping sources: ${sources.join(', ')}`);
        for (const source of sources) {
            try {
                const scraper = registry.getScraper(source);
                if (!scraper) {
                    result.errors.push(`No scraper found for source: ${source}`);
                    continue;
                }
                const tournaments = await scraper.scrape();
                result.tournamentsFound += tournaments.length;
                const input = tournaments.map((t) => ({
                    name: t.name,
                    sourceUrl: t.sourceUrl,
                    source: t.source,
                    location: t.location,
                    city: t.city,
                    state: t.state,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    skillLevels: t.skillLevels,
                    description: t.description,
                    imageUrl: t.imageUrl,
                    registrationUrl: t.registrationUrl,
                }));
                const upsertResult = await upsertTournaments(input);
                result.tournamentsCreated += upsertResult.created;
                result.tournamentsUpdated += upsertResult.updated;
                result.errors.push(...upsertResult.errors);
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`Failed to scrape ${source}: ${msg}`);
            }
        }
        result.success = result.errors.length === 0;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Scrape job failed: ${msg}`);
    }
    finally {
        isRunning = false;
        result.duration = Date.now() - startTime;
        await prisma.scrapeLog.update({
            where: { id: scrapeLog.id },
            data: {
                endTime: new Date(),
                tournamentsFound: result.tournamentsFound,
                errors: result.errors.length > 0 ? result.errors.join('; ') : null,
                status: result.success ? 'completed' : 'failed',
            },
        });
    }
    return result;
}
export function startScheduler() {
    if (scheduledTask) {
        console.log('Scheduler already running');
        return;
    }
    scheduledTask = cron.schedule('0 6 * * *', async () => {
        console.log('Running scheduled scrape job at 6 AM UTC');
        try {
            const result = await runScrapeJob();
            console.log('Scheduled scrape completed:', {
                found: result.tournamentsFound,
                created: result.tournamentsCreated,
                updated: result.tournamentsUpdated,
                errors: result.errors.length,
                duration: `${result.duration}ms`,
            });
        }
        catch (error) {
            console.error('Scheduled scrape failed:', error);
        }
    });
    console.log('Scheduler started - will run daily at 6 AM UTC');
}
export function stopScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        console.log('Scheduler stopped');
    }
}
export async function getLastScrapeStatus() {
    return prisma.scrapeLog.findFirst({
        orderBy: { startTime: 'desc' },
    });
}
export async function getScrapeHistory(limit = 10) {
    return prisma.scrapeLog.findMany({
        orderBy: { startTime: 'desc' },
        take: limit,
    });
}
export function isJobRunning() {
    return isRunning;
}
//# sourceMappingURL=scheduler.js.map